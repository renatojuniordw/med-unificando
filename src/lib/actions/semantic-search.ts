'use server'

import { prisma } from "@/lib/prisma"
import { keywordSearch } from '@/lib/actions/keyword-search'
import { trigramSearch } from '@/lib/actions/trigram-search'
import { buildExpandedTsquery } from '@/lib/keyword-utils'
import {
  classifyQuery,
  refineLowConfidenceClassification,
  type QueryClassification,
  type EmbeddingClassification,
} from '@/lib/search-preprocessor'
import { EMBEDDING, SEARCH } from '@/lib/config'
import { normalizeMedicine } from "@/lib/format"
import { applyScoreAdjustments } from "@/lib/score-adjustments"
import { stripAccents } from '@/lib/text-utils'
import { SYNONYM_MAP } from '@/lib/dictionaries/synonyms'
import { THERAPEUTIC_CLASS_INDICATIONS } from '@/lib/dictionaries/therapeutic-class-indications'
import type { MedicineResult } from "@/types"
import type { FeatureExtractionPipeline } from "@xenova/transformers"

// Cache em memória a nível de módulo: intencional para deploy self-hosted
// (VPS, processo único). Em serverless, cada instância teria sua própria cópia
// e o estado atravessaria requisições — comportamento consistente entre
// instâncias não é garantido. O cache é limitado (SEARCH.CACHE_MAX_ENTRIES) e
// com TTL (SEARCH.CACHE_TTL_MS).
const searchCache = new Map<string, { results: HybridSearchResult; expiresAt: number }>()

function getCachedSearch(query: string, topK: number): HybridSearchResult | null {
  const key = `${query.toLowerCase().trim()}::${topK}`
  const entry = searchCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key)
    return null
  }
  return entry.results
}

function setCachedSearch(query: string, topK: number, results: HybridSearchResult): void {
  const key = `${query.toLowerCase().trim()}::${topK}`
  if (searchCache.size > SEARCH.CACHE_MAX_ENTRIES) {
    const oldest = searchCache.keys().next().value
    if (oldest) searchCache.delete(oldest)
  }
  searchCache.set(key, { results, expiresAt: Date.now() + SEARCH.CACHE_TTL_MS })
}

let extractor: FeatureExtractionPipeline | null = null

async function getModel() {
  if (!extractor) {
    const t0 = performance.now()
    console.log(`[BUSCA DESCRIÇÃO] [Transformers] Carregando modelo "${EMBEDDING.MODEL}"...`)
    const { pipeline, env } = await import("@xenova/transformers")
    env.cacheDir = SEARCH.MODEL_CACHE_DIR
    try {
      extractor = await pipeline("feature-extraction", EMBEDDING.MODEL)
      console.log(`[BUSCA DESCRIÇÃO] [Transformers] Modelo pronto em ${(performance.now() - t0).toFixed(0)}ms`)
    } catch (err) {
      console.error(`[BUSCA DESCRIÇÃO] [Transformers] ❌ Erro ao baixar/carregar modelo "${EMBEDDING.MODEL}":`, err)
      throw err
    }
  }
  return extractor
}

export async function clearEmbeddingsCache() {
  extractor = null
  categoryCentroids = null
}

export async function embedQuery(query: string): Promise<Float32Array> {
  const model = await getModel()
  const result = await model(`query: ${query}`, { pooling: "mean", normalize: true })
  return result.data as Float32Array
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  // a e b já vêm normalizados (normalize: true), então dot product == cosine
  return dot
}

async function embedCentroid(texts: string[]): Promise<Float32Array> {
  const vectors = await Promise.all(texts.map(t => embedQuery(t)))
  const dims = vectors[0].length
  const centroid = new Float32Array(dims)
  for (const v of vectors) {
    for (let i = 0; i < dims; i++) centroid[i] += v[i]
  }
  for (let i = 0; i < dims; i++) centroid[i] /= vectors.length
  return centroid
}

interface CategoryCentroids {
  medicineName: Float32Array
  other: Float32Array
}

let categoryCentroids: CategoryCentroids | null = null

// Amostra nomes reais de medicamentos (tradeName/activeIngredient) do banco
// para servir de âncora "medicine-name" — reflete a distribuição real de
// nomes comerciais, mais robusto que uma lista hardcoded.
async function sampleMedicineNameSeeds(limit = 150): Promise<string[]> {
  try {
    const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM (
         SELECT DISTINCT "tradeName" AS name FROM medicines
         WHERE "tradeName" IS NOT NULL AND "tradeName" != ''
       ) t ORDER BY random() LIMIT $1`,
      limit
    )
    return rows.map(r => r.name).filter(Boolean)
  } catch (err) {
    console.error(`[BUSCA DESCRIÇÃO] ❌ Erro ao buscar sampleMedicineNameSeeds:`, err)
    return []
  }
}

async function getCategoryCentroids(): Promise<CategoryCentroids> {
  if (categoryCentroids) return categoryCentroids

  const medicineNameSeeds = await sampleMedicineNameSeeds()
  const otherSeeds = [
    ...Object.values(THERAPEUTIC_CLASS_INDICATIONS),
    ...Object.values(SYNONYM_MAP).flat(),
  ]

  const [medicineName, other] = await Promise.all([
    embedCentroid(medicineNameSeeds),
    embedCentroid(otherSeeds),
  ])

  categoryCentroids = { medicineName, other }
  return categoryCentroids
}

// Classifica a query como medicine-name vs. condição/classe-terapêutica por
// proximidade aos centróides de categoria. Usado apenas como refinamento
// quando a heurística de classifyQuery cai no fallback genérico.
export async function classifyByEmbedding(queryEmb: Float32Array): Promise<EmbeddingClassification> {
  const centroids = await getCategoryCentroids()
  const simMedicineName = cosineSimilarity(queryEmb, centroids.medicineName)
  const simOther = cosineSimilarity(queryEmb, centroids.other)

  const type = simMedicineName > simOther ? 'medicine-name' : 'other'
  const margin = Math.abs(simMedicineName - simOther)
  const confidence = Math.min(Math.max(0.5 + margin * 2, 0.5), 0.85)

  return { type, confidence }
}

// Campos exibidos nos resultados de busca — evita transferir colunas
// desnecessárias (synonyms/anvisaFileDate/lastImportAt) em listagens.
const SEARCH_MEDICINE_SELECT = {
  id: true,
  reference: true,
  activeIngredient: true,
  tradeName: true,
  similarHolder: true,
  pharmaceuticalForm: true,
  concentration: true,
  inclusionDate: true,
  category: true,
  referenceMedicine: true,
  atcCode: true,
  prescriptionType: true,
  status: true,
  authorization: true,
  presentationCount: true,
  indications: true,
  therapeuticClass: true,
  farmaciaPopular: true,
} as const

export async function semanticSearch(
  query: string,
  topK: number = SEARCH.SEMANTIC_TOP_K,
  precomputedEmbedding?: Float32Array
): Promise<{ score: number; medicine: MedicineResult }[]> {
  if (!query.trim()) return []

  try {
    const t0 = performance.now()
    const queryEmb = precomputedEmbedding ?? await embedQuery(query)
    const vecStr = `[${Array.from(queryEmb).join(",")}]`

    const col = EMBEDDING.COLUMN
    const sql = `
      SELECT id, 1 - ("${col}" <=> $1::vector) AS semantic_score
      FROM medicines
      WHERE "${col}" IS NOT NULL
      ORDER BY "${col}" <=> $1::vector
      LIMIT $2
    `

    const rows = await prisma.$transaction(async (tx) => {
      // ivfflat.probes só se aplica a índices IVFFLAT — ignora erro se for HNSW
      try {
        await tx.$executeRawUnsafe(`SET LOCAL ivfflat.probes = ${SEARCH.IVFFLAT_PROBES}`)
      } catch { /* HNSW ou outro tipo de índice — ignorar */ }
      return tx.$queryRawUnsafe<{ id: number; semantic_score: number }[]>(
        sql,
        vecStr,
        topK,
      )
    }, { timeout: SEARCH.PGVECTOR_TIMEOUT_MS })

    if (rows.length === 0) {
      console.log(`[BUSCA DESCRIÇÃO] [Semântica] 0 registros retornados do pgvector (coluna "${col}" tem dados no banco?)`)
      return []
    }

    const ids = rows.map(r => r.id)
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: ids } },
      select: SEARCH_MEDICINE_SELECT,
    })

    const medMap = new Map(medicines.map(m => [m.id, m]))

    const sorted = rows
      .map(r => {
        const med = medMap.get(r.id)
        return med ? {
          score: r.semantic_score,
          medicine: normalizeMedicine(med) as unknown as MedicineResult,
        } : null
      })
      .filter((r): r is { score: number; medicine: MedicineResult } => r !== null)
      .sort((a, b) => {
        const aActive = a.medicine.status === 'Ativo' ? 0 : 1
        const bActive = b.medicine.status === 'Ativo' ? 0 : 1
        return aActive - bActive || b.score - a.score
      })

    const semMs = (performance.now() - t0).toFixed(0)
    const topSample = sorted.slice(0, 3).map(s => `${s.medicine.tradeName} (${s.score.toFixed(3)})`).join(', ')
    console.log(`[BUSCA DESCRIÇÃO] [Semântica] ${sorted.length} registros em ${semMs}ms [top scores: ${topSample || 'nenhum'}]`)

    return sorted
  } catch (err) {
    console.error(`[BUSCA DESCRIÇÃO] [Semântica] ❌ Erro na busca semântica vetorial:`, err)
    return []
  }
}

const RRF_K = SEARCH.RRF_K
const SEMANTIC_HARD_MIN = SEARCH.SEMANTIC_HARD_MIN
const SEMANTIC_STRONG = SEARCH.SEMANTIC_STRONG
const SEMANTIC_CEILING = SEARCH.SEMANTIC_CEILING
const KEYWORD_SATURATION = SEARCH.KEYWORD_SATURATION
const SEMANTIC_WEIGHT = SEARCH.SEMANTIC_WEIGHT
const KEYWORD_WEIGHT = SEARCH.KEYWORD_WEIGHT
const TRIGRAM_WEIGHT = SEARCH.TRIGRAM_WEIGHT
const NAME_MATCH_BOOSTS = SEARCH.NAME_MATCH_BOOSTS

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function passesSemanticGate(
  score: number,
  hasKeywordSupport: boolean,
  classification: QueryClassification
): boolean {
  const isNameQuery = classification.type === 'medicine-name' && classification.confidence >= SEARCH.NAME_QUERY_MIN_CONFIDENCE
  const hardMin = isNameQuery ? SEARCH.SEMANTIC_HARD_MIN_NAME_QUERY : SEMANTIC_HARD_MIN
  const strong = isNameQuery ? SEARCH.SEMANTIC_STRONG_NAME_QUERY : SEMANTIC_STRONG
  if (score < hardMin) return false
  if (score >= strong) return true
  return hasKeywordSupport
}

function semanticComponent(cosine: number): number {
  return clamp((cosine - SEMANTIC_HARD_MIN) / (SEMANTIC_CEILING - SEMANTIC_HARD_MIN), 0, 1)
}

function keywordComponent(tsRank: number): number {
  return Math.min(tsRank / KEYWORD_SATURATION, 1)
}

function trigramComponent(score: number): number {
  return clamp(score / SEARCH.TRIGRAM_COMPONENT_DIVISOR, 0, 1)
}

function honestScore(
  semanticRaw: number | null,
  keywordRaw: number | null,
  trigramRaw: number | null
): number {
  const sem = semanticRaw !== null ? semanticComponent(semanticRaw) : null
  const kw = keywordRaw !== null ? keywordComponent(keywordRaw) : null
  const tri = trigramRaw !== null ? trigramComponent(trigramRaw) : null

  // Todos os três presentes
  if (sem !== null && kw !== null && tri !== null) {
    return SEMANTIC_WEIGHT * sem + KEYWORD_WEIGHT * kw + TRIGRAM_WEIGHT * tri
  }

  // Dois componentes presentes — redistribui o peso ausente
  if (sem !== null && kw !== null) return SEMANTIC_WEIGHT * sem + KEYWORD_WEIGHT * kw
  if (sem !== null && tri !== null) return SEMANTIC_WEIGHT * sem + TRIGRAM_WEIGHT * tri
  if (kw !== null && tri !== null) return KEYWORD_WEIGHT * kw + TRIGRAM_WEIGHT * tri

  // Um componente apenas — redutor de confiança
  const penalty = SEARCH.SINGLE_SOURCE_PENALTY
  if (sem !== null) return sem * penalty
  if (kw !== null) return kw * penalty
  if (tri !== null) return tri * penalty

  return 0
}

// Extrai termos significativos da query (remove "remédio para", stop words)
function extractQueryTerms(query: string): string[] {
  return query.toLowerCase()
    .replace(/rem[eé]dio\s+para\s+/g, '')
    .replace(/medicamento\s+para\s+/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2)
    .filter(t => !['dos', 'das', 'com', 'sem', 'para', 'pelo', 'pela'].includes(t))
}

// Verifica se um medicamento tem relação textual com os termos da busca
function medicineRelatesToQuery(medicine: MedicineResult, queryTerms: string[]): boolean {
  const tradeName = (medicine.tradeName || '').toLowerCase()
  const ingredient = (medicine.activeIngredient || '').toLowerCase()
  const indications = (medicine.indications || '').toLowerCase()
  const medicineText = [tradeName, ingredient, indications].join(' ')
  return queryTerms.some(term => medicineText.includes(term))
}

// Detecta falsos positivos onde a query é uma substring curta do nome do medicamento
// sem suporte keyword ou trigram (ex: "rona" dentro de "CORONA" quando buscou "dipirona")
function isSubstringFalsePositive(
  query: string,
  medicine: MedicineResult,
  hasKeywordSupport: boolean,
  hasTrigramSupport: boolean
): boolean {
  const normalizedQuery = stripAccents(query.toLowerCase().trim())
  if (normalizedQuery.length >= SEARCH.SUBSTRING_MIN_LENGTH) return false

  const tradeName = stripAccents((medicine.tradeName || '').toLowerCase())
  const ingredient = stripAccents((medicine.activeIngredient || '').toLowerCase())

  const queryIsSubstring = tradeName.includes(normalizedQuery) || ingredient.includes(normalizedQuery)
  if (!queryIsSubstring) return false

  // Se tem suporte keyword ou trigram, não é falso positivo
  if (hasKeywordSupport || hasTrigramSupport) return false

  return true
}

// Gera sugestões de correção quando a busca retorna poucos resultados ou score baixo
async function generateSuggestions(
  query: string,
  results: { score: number; medicine: MedicineResult }[],
  isMedicineNameQuery: boolean
): Promise<string[]> {
  // Só sugerir para queries curtas (provavelmente nomes de medicamentos)
  if (query.length < 3) return []
  // Não sugerir se já tem muitos bons resultados
  if (results.length >= 5 && results[0].score >= 0.5) return []

  try {
    const { trigramSearch: triSearch } = await import('@/lib/actions/trigram-search')
    const candidates = await triSearch(query, 5)
    if (candidates.length === 0) return []

    const suggestions: string[] = []
    const normalizedQuery = stripAccents(query.toLowerCase().trim())

    // Buscar nomes dos medicamentos candidatos
    if (candidates.length > 0) {
      const ids = candidates.map(c => c.medicineId)
      const meds = await prisma.medicine.findMany({
        where: { id: { in: ids } },
        select: { tradeName: true, activeIngredient: true },
      })

      for (const med of meds) {
        const tradeName = (med.tradeName || '').trim()
        const ingredient = (med.activeIngredient || '').trim()
        const normalizedTrade = stripAccents(tradeName.toLowerCase())

        // Não sugerir o próprio query
        if (normalizedTrade === normalizedQuery) continue

        // Sugerir se o trigram score é alto o suficiente
        const candidate = candidates.find(c => c.trigramScore > 0.3)
        if (candidate && !suggestions.includes(tradeName)) {
          suggestions.push(tradeName)
        }

        // Também sugerir por ingrediente ativo se for nome de medicamento
        if (isMedicineNameQuery && ingredient) {
          const normalizedIngredient = stripAccents(ingredient.toLowerCase())
          if (normalizedIngredient !== normalizedQuery && !suggestions.includes(ingredient)) {
            suggestions.push(ingredient)
          }
        }

        if (suggestions.length >= 3) break
      }
    }

    return suggestions
  } catch (err) {
    console.warn(`[BUSCA DESCRIÇÃO] Falha ao gerar sugestões:`, err)
    return []
  }
}

// Boost para match exato ou prefixo no nome do medicamento
function nameMatchBoost(
  query: string,
  medicine: MedicineResult
): number {
  const normalizedQuery = stripAccents(query.toLowerCase().trim())
  const tradeName = stripAccents((medicine.tradeName || '').toLowerCase())
  const ingredient = stripAccents((medicine.activeIngredient || '').toLowerCase())

  // Match exato no tradeName
  if (tradeName === normalizedQuery) return NAME_MATCH_BOOSTS.exact
  // Prefixo do tradeName (query é prefixo do nome)
  if (tradeName.startsWith(normalizedQuery)) return NAME_MATCH_BOOSTS.prefix
  // Match exato no activeIngredient
  if (ingredient === normalizedQuery) return NAME_MATCH_BOOSTS.ingredient
  // activeIngredient contém query como palavra inteira
  if (ingredient.split(/\s+/).includes(normalizedQuery)) return NAME_MATCH_BOOSTS.ingredientWord

  return 0
}

export type MatchReason =
  | { type: 'semantic'; score: number }
  | { type: 'keyword'; score: number }
  | { type: 'trigram'; score: number }
  | { type: 'name-exact'; boost: number }
  | { type: 'name-prefix'; boost: number }
  | { type: 'ingredient-match'; boost: number }

export interface SearchResultItem {
  score: number
  medicine: MedicineResult
  matchReasons: MatchReason[]
}

// Log de analytics — fire-and-forget
async function logSearch(
  query: string,
  resultsCount: number,
  topScore: number | null,
  queryType: string,
  responseTimeMs: number
): Promise<void> {
  try {
    if (typeof prisma.$executeRawUnsafe === 'function') {
      await prisma.$executeRawUnsafe(
        `INSERT INTO search_logs (query, results_count, top_score, query_type, response_time_ms)
         VALUES ($1, $2, $3, $4, $5)`,
        query, resultsCount, topScore, queryType, Math.round(Number(responseTimeMs))
      )
    }
  } catch (err) {
    console.warn(`[BUSCA DESCRIÇÃO] [Analytics] Falha ao gravar search_logs no banco:`, err)
  }
}

export interface HybridSearchResult {
  results: SearchResultItem[]
  suggestions: string[]
}

// Fusão RRF única — usada tanto no caminho principal (3 fontes) quanto nos fallbacks
function rrfFusion(
  rankMaps: { rank: Map<number, number>; weight: number }[],
  rrfK: number
): Map<number, number> {
  const scores = new Map<number, number>()
  for (const { rank, weight } of rankMaps) {
    for (const [id, position] of rank) {
      scores.set(id, (scores.get(id) ?? 0) + weight / (rrfK + position))
    }
  }
  return scores
}

// ---------------------------------------------------------------------------
// Pipeline da busca híbrida — cada etapa é uma função isolada para manter a
// orquestração legível e testável. Nenhuma mudança de comportamento.
// ---------------------------------------------------------------------------

interface SourceCollection {
  semanticResults: { score: number; medicine: MedicineResult }[]
  keywordResults: { medicineId: number; keywordScore: number }[]
  trigramResults: { medicineId: number; trigramScore: number }[]
  keywordIds: Set<number>
  trigramIds: Set<number>
  queryTerms: string[]
  searchMs: string
}

// Embedding da query — calculado uma única vez e reaproveitado na busca
// semântica e no refinamento de classificação (evita rodar o modelo 2x)
async function embedQueryForPipeline(query: string): Promise<Float32Array> {
  try {
    const tEmb = performance.now()
    const queryEmb = await embedQuery(query)
    console.log(`🧠 [BUSCA DESCRIÇÃO] Embedding calculado em ${(performance.now() - tEmb).toFixed(0)}ms (dim: ${queryEmb.length})`)
    return queryEmb
  } catch (err) {
    console.error(`💥 [BUSCA DESCRIÇÃO] Falha ao gerar embedding para "${query}":`, err)
    throw err
  }
}

// Classificação da query para decisões adaptativas (com refinamento por embedding)
async function classifyQueryForPipeline(
  query: string,
  queryEmb: Float32Array
): Promise<{ classification: QueryClassification; isNameQuery: boolean }> {
  let classification = classifyQuery(query)
  const initialType = classification.type
  if (classification.confidence <= SEARCH.CLASSIFICATION_REFINE_MAX_CONFIDENCE) {
    try {
      const embeddingClassification = await classifyByEmbedding(queryEmb)
      classification = refineLowConfidenceClassification(classification, embeddingClassification, query)
      if (classification.type !== initialType) {
        console.log(`🏷️  [BUSCA DESCRIÇÃO] Classificação refinada por embedding: ${initialType} → ${classification.type} (confiança: ${classification.confidence.toFixed(2)})`)
      }
    } catch (err) {
      console.warn(`⚠️ [BUSCA DESCRIÇÃO] Refinamento por embedding falhou (usando heurística):`, err)
    }
  }
  const isNameQuery = classification.type === 'medicine-name' && classification.confidence >= SEARCH.NAME_QUERY_MIN_CONFIDENCE
  console.log(`🏷️  [BUSCA DESCRIÇÃO] Tipo de query: "${classification.type}" (confiança: ${classification.confidence.toFixed(2)}, isNameQuery=${isNameQuery})`)
  return { classification, isNameQuery }
}

// Coleta paralela das três fontes (semântica + keyword + trigram)
async function collectSearchSources(
  query: string,
  queryEmb: Float32Array,
  topK: number
): Promise<SourceCollection> {
  const t1 = performance.now()
  const [semanticResults, keywordResults, trigramResults] = await Promise.all([
    semanticSearch(query, topK * SEARCH.SOURCE_FETCH_MULTIPLIER, queryEmb),
    keywordSearch(query, topK * SEARCH.SOURCE_FETCH_MULTIPLIER),
    trigramSearch(query, topK * SEARCH.SOURCE_FETCH_MULTIPLIER),
  ])
  const searchMs = (performance.now() - t1).toFixed(0)

  console.log(`📊 [BUSCA DESCRIÇÃO] Coleta paralela concluída em ${searchMs}ms:`)
  console.log(`   ├─ Semântica: ${semanticResults.length} registros`)
  console.log(`   ├─ Keyword (FTS): ${keywordResults.length} registros`)
  console.log(`   └─ Trigram: ${trigramResults.length} registros`)

  return {
    semanticResults,
    keywordResults,
    trigramResults,
    keywordIds: new Set(keywordResults.map(r => r.medicineId)),
    trigramIds: new Set(trigramResults.map(r => r.medicineId)),
    queryTerms: extractQueryTerms(query),
    searchMs,
  }
}

// Filtra os resultados semânticos pelo gate adaptativo (por tipo de query)
function filterSemanticByGate(
  sources: SourceCollection,
  classification: QueryClassification,
  isNameQuery: boolean
): { filteredSemanticResults: { score: number; medicine: MedicineResult }[] } {
  const filteredSemanticResults = sources.semanticResults.filter(r => {
    const hasKeyword = sources.keywordIds.has(r.medicine.id)
    return passesSemanticGate(r.score, hasKeyword, classification)
  })

  const hardMin = isNameQuery ? SEARCH.SEMANTIC_HARD_MIN_NAME_QUERY : SEARCH.SEMANTIC_HARD_MIN
  const strong = isNameQuery ? SEARCH.SEMANTIC_STRONG_NAME_QUERY : SEARCH.SEMANTIC_STRONG
  console.log(`🚪 [BUSCA DESCRIÇÃO] Gate Semântico: ${filteredSemanticResults.length}/${sources.semanticResults.length} aprovados (hardMin=${hardMin}, strong=${strong})`)

  return { filteredSemanticResults }
}

// Fallback quando nenhum resultado semântico passa no gate: mescla keyword + trigram
async function fallbackNoSemantic(
  query: string,
  sources: SourceCollection,
  topK: number,
  t0: number
): Promise<HybridSearchResult> {
  const { keywordResults, trigramResults, keywordIds, trigramIds } = sources

  if (keywordResults.length === 0 && trigramResults.length === 0) {
    console.warn(`❌ [BUSCA DESCRIÇÃO] Nenhum resultado em nenhuma fonte (Semântica: ${sources.semanticResults.length} [0 aprovados pelo gate], Keyword: 0, Trigram: 0).`)
    console.log(`================== [BUSCA DESCRIÇÃO] FIM (0 resultados) ==================\n`)
    return { results: [], suggestions: [] }
  }

  console.log(`🔄 [BUSCA DESCRIÇÃO] Ativando fallback: mesclando Keyword (${keywordResults.length}) + Trigram (${trigramResults.length}) via RRF`)
  const keywordRank = new Map(keywordResults.map((r, i) => [r.medicineId, i + 1]))
  const trigramRank = new Map(trigramResults.map((r, i) => [r.medicineId, i + 1]))
  const keywordScoreMapFb = new Map(keywordResults.map(r => [r.medicineId, r.keywordScore]))
  const trigramScoreMapFb = new Map(trigramResults.map(r => [r.medicineId, r.trigramScore]))
  const allFallbackIds = new Set([...keywordIds, ...trigramIds])

  const fallbackScores = rrfFusion([
    { rank: keywordRank, weight: KEYWORD_WEIGHT },
    { rank: trigramRank, weight: TRIGRAM_WEIGHT },
  ], RRF_K)
  const topFallbackIds = [...allFallbackIds]
    .sort((a, b) => (fallbackScores.get(b) ?? 0) - (fallbackScores.get(a) ?? 0))
    .slice(0, topK)

  const medicines = await prisma.medicine.findMany({
    where: { id: { in: topFallbackIds } },
    select: SEARCH_MEDICINE_SELECT,
  })
  const medMap = new Map(medicines.map(m => [m.id, m]))
  const fallbackResults = topFallbackIds
    .map(id => ({
      score: honestScore(
        null,
        keywordScoreMapFb.get(id) ?? null,
        trigramScoreMapFb.get(id) ?? null
      ),
      medicine: medMap.get(id) as unknown as MedicineResult,
      matchReasons: [] as MatchReason[],
    }))
    .filter(r => r.medicine)
    .slice(0, topK)

  const adjustedFallback = await applyScoreAdjustments(query, fallbackResults) as SearchResultItem[]
  const totalMs = (performance.now() - t0).toFixed(0)
  console.log(`✅ [BUSCA DESCRIÇÃO] [Fallback] Concluído em ${totalMs}ms | Retornando ${adjustedFallback.length} medicamentos`)
  console.log(`================== [BUSCA DESCRIÇÃO] FIM ==================\n`)
  return { results: adjustedFallback, suggestions: [] }
}

// Fallback semântico puro quando keyword e trigram vêm vazios
async function fallbackSemanticOnly(
  query: string,
  filteredSemanticResults: { score: number; medicine: MedicineResult }[],
  topK: number,
  t0: number
): Promise<HybridSearchResult> {
  console.log(`ℹ️ [BUSCA DESCRIÇÃO] Sem Keyword ou Trigram. Usando apenas ${filteredSemanticResults.length} resultados Semânticos aprovados.`)
  const semanticOnlyResults = filteredSemanticResults
    .map(r => ({
      score: honestScore(r.score, null, null),
      medicine: normalizeMedicine(r.medicine),
      matchReasons: [{ type: 'semantic' as const, score: r.score }],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
  const adjustedSemanticOnly = await applyScoreAdjustments(query, semanticOnlyResults) as SearchResultItem[]
  const totalMs = (performance.now() - t0).toFixed(0)
  console.log(`✅ [BUSCA DESCRIÇÃO] [Apenas Semântica] Concluído em ${totalMs}ms | Retornando ${adjustedSemanticOnly.length} medicamentos`)
  console.log(`================== [BUSCA DESCRIÇÃO] FIM ==================\n`)
  return { results: adjustedSemanticOnly, suggestions: [] }
}

// Fusão RRF das 3 fontes + carregamento dos medicamentos restantes
async function fuseAndFetch(
  filteredSemanticResults: { score: number; medicine: MedicineResult }[],
  sources: SourceCollection,
  topK: number
): Promise<{ initialResults: SearchResultItem[] }> {
  const { keywordResults, trigramResults } = sources

  const semanticRank = new Map(filteredSemanticResults.map((r, i) => [r.medicine.id, i + 1]))
  const keywordRank = new Map(keywordResults.map((r, i) => [r.medicineId, i + 1]))
  const trigramRank = new Map(trigramResults.map((r, i) => [r.medicineId, i + 1]))

  const allIds = new Set([
    ...filteredSemanticResults.map(r => r.medicine.id),
    ...keywordResults.map(r => r.medicineId),
    ...trigramResults.map(r => r.medicineId),
  ])

  const scores = rrfFusion([
    { rank: semanticRank, weight: SEMANTIC_WEIGHT },
    { rank: keywordRank, weight: KEYWORD_WEIGHT },
    { rank: trigramRank, weight: TRIGRAM_WEIGHT },
  ], RRF_K)

  // Margem de 2x antes do corte final: permite que ajustes de feedback
  // promovam candidatos que ficariam fora do topK inicial.
  const topIds = [...allIds]
    .sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0))
    .slice(0, topK * SEARCH.FINAL_CUT_MARGIN)

  const existingMedicines = filteredSemanticResults
    .filter(r => topIds.includes(r.medicine.id))
    .map(r => r.medicine)

  const remainingIds = topIds.filter(id => !existingMedicines.some(m => m.id === id))
  if (remainingIds.length > 0) {
    const remaining = await prisma.medicine.findMany({
      where: { id: { in: remainingIds } },
      select: SEARCH_MEDICINE_SELECT,
    })
    existingMedicines.push(...remaining.map(normalizeMedicine) as unknown as MedicineResult[])
  }

  const medMap = new Map(existingMedicines.map(m => [m.id, m]))
  const semanticScoreMap = new Map(filteredSemanticResults.map(r => [r.medicine.id, r.score]))
  const keywordScoreMap = new Map(keywordResults.map(r => [r.medicineId, r.keywordScore]))
  const trigramScoreMap = new Map(trigramResults.map(r => [r.medicineId, r.trigramScore]))

  const initialResults = topIds
    .map(id => {
      const semScore = semanticScoreMap.get(id) ?? null
      const kwScore = keywordScoreMap.get(id) ?? null
      const triScore = trigramScoreMap.get(id) ?? null
      const matchReasons: MatchReason[] = []
      if (semScore !== null) matchReasons.push({ type: 'semantic', score: semScore })
      if (kwScore !== null) matchReasons.push({ type: 'keyword', score: kwScore })
      if (triScore !== null) matchReasons.push({ type: 'trigram', score: triScore })
      return {
        score: honestScore(semScore, kwScore, triScore),
        medicine: medMap.get(id)!,
        matchReasons,
      }
    })
    .filter(r => r.medicine)

  return { initialResults }
}

// Pós-processamento: falsos positivos por substring, boost por nome,
// verificação keyword (tsvector) e penalidade por falta de suporte.
async function postProcessResults(
  query: string,
  initialResults: SearchResultItem[],
  sources: SourceCollection,
  hasKeywordResults: boolean
): Promise<SearchResultItem[]> {
  const { keywordIds, trigramIds, queryTerms } = sources

  let boostedCount = 0
  let falsePositiveCount = 0

  const filteredResults = initialResults.map(r => {
    const hasKeyword = keywordIds.has(r.medicine.id)
    const hasTrigram = trigramIds.has(r.medicine.id)

    // Remover falsos positivos de substring curta
    if (isSubstringFalsePositive(query, r.medicine, hasKeyword, hasTrigram)) {
      falsePositiveCount++
      return { ...r, score: r.score * SEARCH.SUBSTRING_FALSE_POSITIVE_PENALTY }
    }

    // Boost por match exato no nome
    const boost = nameMatchBoost(query, r.medicine)
    const reasons = [...r.matchReasons]
    if (boost > 0) {
      boostedCount++
      if (boost >= NAME_MATCH_BOOSTS.ingredient) reasons.push({ type: 'name-exact', boost })
      else if (boost >= NAME_MATCH_BOOSTS.ingredientWord) reasons.push({ type: 'ingredient-match', boost })
      else reasons.push({ type: 'name-prefix', boost })
    }
    return { ...r, score: r.score + boost, matchReasons: reasons }
  }).sort((a, b) => b.score - a.score)

  // Verificação keyword via tsvector — só penaliza quem não tem suporte real
  let keywordVerifiedIds = new Set<number>()
  if (hasKeywordResults) {
    const tsquery = buildExpandedTsquery(query)
    if (tsquery) {
      const allResultIds = filteredResults.map(r => r.medicine.id)
      if (allResultIds.length > 0) {
        interface IdRow { id: number }
        const verified = await prisma.$queryRawUnsafe<IdRow[]>(
          `SELECT id FROM medicines WHERE id = ANY($1::int[]) AND "search_document" @@ to_tsquery('${SEARCH.TSQUERY_LANGUAGE}', $2::text)`,
          allResultIds,
          tsquery
        )
        keywordVerifiedIds = new Set(verified.map(r => r.id))
      }
    }
  }

  let penalizedCount = 0
  const penalizedResults = filteredResults.map(r => {
    const hasKeyword = keywordVerifiedIds.has(r.medicine.id)
    const hasTrigram = trigramIds.has(r.medicine.id)
    if (hasKeyword || hasTrigram) return r
    if (!medicineRelatesToQuery(r.medicine, queryTerms)) {
      penalizedCount++
      return { ...r, score: r.score * SEARCH.NO_SUPPORT_PENALTY }
    }
    return r
  }).sort((a, b) => b.score - a.score)

  console.log(`⚖️  [BUSCA DESCRIÇÃO] Pós-processamento: ${boostedCount} com boost de nome, ${falsePositiveCount} com penalidade substring, ${penalizedCount} sem suporte`)

  return penalizedResults
}

// Ajustes de feedback + corte final + sugestões + logs de resumo
async function finalizeResults(
  query: string,
  penalizedResults: SearchResultItem[],
  sources: SourceCollection,
  isNameQuery: boolean,
  queryType: string,
  totalMs: string,
  topK: number
): Promise<{ finalResults: SearchResultItem[]; suggestions: string[] }> {
  // Aplicar ajustes de score baseados em feedback dos usuários
  const adjustedResults = await applyScoreAdjustments(query, penalizedResults) as SearchResultItem[]

  // Corte final no topK — depois dos ajustes, para permitir promoção via feedback
  const finalResults = adjustedResults.slice(0, topK)

  // Gerar sugestões quando poucos resultados ou score baixo
  const suggestions = await generateSuggestions(query, finalResults, isNameQuery)

  console.log(
    `[search] "${query}" → ${finalResults.length} results ` +
    `(${sources.searchMs}ms search, ${totalMs}ms total) ` +
    `[${queryType}] ` +
    `[sem:${sources.semanticResults.length} kw:${sources.keywordResults.length} tri:${sources.trigramResults.length}]` +
    (suggestions.length > 0 ? ` suggestions: [${suggestions.join(', ')}]` : '')
  )

  console.log(`✅ [BUSCA DESCRIÇÃO] Concluído em ${totalMs}ms | Retornando ${finalResults.length} medicamentos (topK=${topK})`)

  if (finalResults.length > 0) {
    console.log(`📋 [BUSCA DESCRIÇÃO] Top ${Math.min(finalResults.length, 5)} resultados:`)
    finalResults.slice(0, 5).forEach((item, idx) => {
      const reasons = item.matchReasons.map(r => {
        if (r.type === 'semantic') return `sem:${r.score.toFixed(3)}`
        if (r.type === 'keyword') return `kw:${r.score.toFixed(3)}`
        if (r.type === 'trigram') return `tri:${r.score.toFixed(3)}`
        return `${r.type}:+${r.boost.toFixed(2)}`
      }).join(', ')
      console.log(
        `   ${idx + 1}. [Score ${item.score.toFixed(3)}] ${item.medicine.tradeName || '(Sem nome)'} ` +
        `(${item.medicine.activeIngredient || '-'}) [${item.medicine.status || '-'}] - Motivos: [${reasons || 'ponderado'}]`
      )
    })
  } else {
    console.warn(`⚠️ [BUSCA DESCRIÇÃO] ATENÇÃO: Retornou ZERO resultados finais para "${query}"!`)
  }

  if (suggestions.length > 0) {
    console.log(`💡 [BUSCA DESCRIÇÃO] Sugestões: [${suggestions.join(', ')}]`)
  }
  console.log(`================== [BUSCA DESCRIÇÃO] FIM ==================\n`)

  return { finalResults, suggestions }
}

// Persistência: cache + log analytics (fire-and-forget)
function persistSearch(
  query: string,
  topK: number,
  searchResult: HybridSearchResult,
  queryType: string,
  totalMs: number
): void {
  setCachedSearch(query, topK, searchResult)
  logSearch(query, searchResult.results.length, searchResult.results[0]?.score ?? null, queryType, totalMs)
}

export async function hybridSearch(
  query: string,
  topK: number = SEARCH.HYBRID_TOP_K
): Promise<HybridSearchResult> {
  if (!query.trim()) return { results: [], suggestions: [] }

  // Verificar cache
  const cached = getCachedSearch(query, topK)
  if (cached) {
    console.log(`⚡ [BUSCA DESCRIÇÃO] "${query}" → CACHE HIT (${cached.results.length} resultados)`)
    return cached
  }

  const t0 = performance.now()
  console.log(`\n================== [BUSCA DESCRIÇÃO] INÍCIO ==================`)
  console.log(`🔍 [BUSCA DESCRIÇÃO] Query: "${query}" | topK: ${topK}`)

  try {
    const queryEmb = await embedQueryForPipeline(query)
    const { classification, isNameQuery } = await classifyQueryForPipeline(query, queryEmb)
    const sources = await collectSearchSources(query, queryEmb, topK)
    const { filteredSemanticResults } = filterSemanticByGate(sources, classification, isNameQuery)

    // Sem resultados semânticos aprovados — fallback keyword + trigram
    if (filteredSemanticResults.length === 0) {
      return await fallbackNoSemantic(query, sources, topK, t0)
    }

    // Sem keyword/trigram — usa apenas o semântico aprovado
    if (sources.keywordResults.length === 0 && sources.trigramResults.length === 0) {
      return await fallbackSemanticOnly(query, filteredSemanticResults, topK, t0)
    }

    const { initialResults } = await fuseAndFetch(filteredSemanticResults, sources, topK)
    const penalizedResults = await postProcessResults(query, initialResults, sources, sources.keywordResults.length > 0)
    const totalMs = (performance.now() - t0).toFixed(0)
    const { finalResults, suggestions } = await finalizeResults(
      query, penalizedResults, sources, isNameQuery, classification.type, totalMs, topK
    )

    const searchResult: HybridSearchResult = { results: finalResults, suggestions }
    persistSearch(query, topK, searchResult, classification.type, Number(totalMs))

    return searchResult
  } catch (error) {
    console.error(`💥 [BUSCA DESCRIÇÃO] ❌ ERRO CRÍTICO ao processar busca por "${query}":`, error)
    console.log(`================== [BUSCA DESCRIÇÃO] FIM COM ERRO ==================\n`)
    throw error
  }
}