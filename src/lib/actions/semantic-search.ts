'use server'

import { prisma } from "@/lib/prisma"
import { keywordSearch } from '@/lib/actions/keyword-search'
import { trigramSearch } from '@/lib/actions/trigram-search'
import { buildExpandedTsquery } from '@/lib/keyword-utils'
import { classifyQuery, type QueryClassification } from '@/lib/search-preprocessor'
import { EMBEDDING, SEARCH } from '@/lib/config'
import { normalizeMedicine } from "@/lib/format"
import { applyScoreAdjustments } from "@/lib/score-adjustments"
import type { MedicineResult } from "@/types"
import type { FeatureExtractionPipeline } from "@xenova/transformers"

// Cache em memória para resultados de busca (TTL: 5 min)
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000
const searchCache = new Map<string, { results: { score: number; medicine: MedicineResult }[]; expiresAt: number }>()

function getCachedSearch(query: string, topK: number): { score: number; medicine: MedicineResult }[] | null {
  const key = `${query.toLowerCase().trim()}::${topK}`
  const entry = searchCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key)
    return null
  }
  return entry.results
}

function setCachedSearch(query: string, topK: number, results: { score: number; medicine: MedicineResult }[]): void {
  const key = `${query.toLowerCase().trim()}::${topK}`
  // Limitar tamanho do cache (max 500 entradas)
  if (searchCache.size > 500) {
    const oldest = searchCache.keys().next().value
    if (oldest) searchCache.delete(oldest)
  }
  searchCache.set(key, { results, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS })
}

let extractor: FeatureExtractionPipeline | null = null

async function getModel() {
  if (!extractor) {
    const { pipeline, env } = await import("@xenova/transformers")
    env.cacheDir = "/tmp/.transformers-cache"
    extractor = await pipeline("feature-extraction", EMBEDDING.MODEL)
  }
  return extractor
}

export async function clearEmbeddingsCache() {
  extractor = null
}

export async function semanticSearch(
  query: string,
  topK: number = 60
): Promise<{ score: number; medicine: MedicineResult }[]> {
  if (!query.trim()) return []

  const model = await getModel()

  const result = await model(`query: ${query}`, { pooling: "mean", normalize: true })
  const queryEmb = result.data as Float32Array
  const vecStr = `[${Array.from(queryEmb).join(",")}]`

  const col = EMBEDDING.COLUMN
  const sql = `
    SELECT id, 1 - ("${col}" <=> $1::vector) AS semantic_score
    FROM medicines
    WHERE "${col}" IS NOT NULL
    ORDER BY "${col}" <=> $1::vector
    LIMIT $2
  `

  // 30s timeout for large vector search
  const rows = await prisma.$transaction(async (tx) => {
    // ivfflat.probes só se aplica a índices IVFFLAT — ignora erro se for HNSW
    try {
      await tx.$executeRawUnsafe(`SET LOCAL ivfflat.probes = 40`)
    } catch { /* HNSW ou outro tipo de índice — ignorar */ }
    return tx.$queryRawUnsafe<{ id: number; semantic_score: number }[]>(
      sql,
      vecStr,
      topK,
    )
  }, { timeout: 30000 })

  if (rows.length === 0) return []

  const ids = rows.map(r => r.id)
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: ids } },
  })

  const medMap = new Map(medicines.map(m => [m.id, m]))

  return rows
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
}

const RRF_K = SEARCH.RRF_K
const SEMANTIC_HARD_MIN = SEARCH.SEMANTIC_HARD_MIN
const SEMANTIC_STRONG = SEARCH.SEMANTIC_STRONG
const SEMANTIC_CEILING = SEARCH.SEMANTIC_CEILING
const KEYWORD_SATURATION = 0.15
const SEMANTIC_WEIGHT = SEARCH.SEMANTIC_WEIGHT
const KEYWORD_WEIGHT = SEARCH.KEYWORD_WEIGHT
const TRIGRAM_WEIGHT = SEARCH.TRIGRAM_WEIGHT

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function passesSemanticGate(
  score: number,
  hasKeywordSupport: boolean,
  classification: QueryClassification
): boolean {
  const isNameQuery = classification.type === 'medicine-name' && classification.confidence >= 0.6
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
  return clamp(score / 0.5, 0, 1)
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

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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

// Boost para match exato ou prefixo no nome do medicamento
function nameMatchBoost(
  query: string,
  medicine: MedicineResult
): number {
  const normalizedQuery = stripAccents(query.toLowerCase().trim())
  const tradeName = stripAccents((medicine.tradeName || '').toLowerCase())
  const ingredient = stripAccents((medicine.activeIngredient || '').toLowerCase())

  // Match exato no tradeName
  if (tradeName === normalizedQuery) return 0.15
  // Prefixo do tradeName (query é prefixo do nome)
  if (tradeName.startsWith(normalizedQuery)) return 0.10
  // Match exato no activeIngredient
  if (ingredient === normalizedQuery) return 0.12
  // activeIngredient contém query como palavra inteira
  if (ingredient.split(/\s+/).includes(normalizedQuery)) return 0.08

  return 0
}

export async function hybridSearch(
  query: string,
  topK: number = 20
): Promise<{ score: number; medicine: MedicineResult }[]> {
  if (!query.trim()) return []

  // Verificar cache
  const cached = getCachedSearch(query, topK)
  if (cached) {
    console.log(`[search] "${query}" → cache hit (${cached.length} results)`)
    return cached
  }

  const t0 = performance.now()

  // Classificar a query para decisões adaptativas
  const classification = classifyQuery(query)
  const isNameQuery = classification.type === 'medicine-name' && classification.confidence >= 0.6

  // Busca paralela: semântica + keyword + trigram
  const t1 = performance.now()
  const [semanticResults, keywordResults, trigramResults] = await Promise.all([
    semanticSearch(query, topK * 5),
    keywordSearch(query, topK * 5),
    trigramSearch(query, topK * 5),
  ])
  const searchMs = (performance.now() - t1).toFixed(0)

  const keywordIds = new Set(keywordResults.map(r => r.medicineId))
  const trigramIds = new Set(trigramResults.map(r => r.medicineId))
  const queryTerms = extractQueryTerms(query)

  // Filter semantic results: pass through gate (com threshold adaptativo)
  const filteredSemanticResults = semanticResults.filter(r => {
    const hasKeyword = keywordIds.has(r.medicine.id)
    return passesSemanticGate(r.score, hasKeyword, classification)
  })

  // If no semantic results remain, fall back to keyword + trigram
  if (filteredSemanticResults.length === 0) {
    if (keywordResults.length === 0 && trigramResults.length === 0) return []
    // Merge keyword + trigram via RRF para fallback
    const keywordRank = new Map(keywordResults.map((r, i) => [r.medicineId, i + 1]))
    const trigramRank = new Map(trigramResults.map((r, i) => [r.medicineId, i + 1]))
    const keywordScoreMapFb = new Map(keywordResults.map(r => [r.medicineId, r.keywordScore]))
    const trigramScoreMapFb = new Map(trigramResults.map(r => [r.medicineId, r.trigramScore]))
    const allFallbackIds = new Set([...keywordIds, ...trigramIds])

    const fallbackScores = [...allFallbackIds].map(id => ({
      id,
      rrfScore:
        (KEYWORD_WEIGHT / (RRF_K + (keywordRank.get(id) ?? Infinity))) +
        (TRIGRAM_WEIGHT / (RRF_K + (trigramRank.get(id) ?? Infinity))),
    }))
    fallbackScores.sort((a, b) => b.rrfScore - a.rrfScore)
    const topFallbackIds = fallbackScores.slice(0, topK).map(s => s.id)

    const medicines = await prisma.medicine.findMany({ where: { id: { in: topFallbackIds } } })
    const medMap = new Map(medicines.map(m => [m.id, m]))
    return topFallbackIds
      .map(id => ({
        score: honestScore(
          null,
          keywordScoreMapFb.get(id) ?? null,
          trigramScoreMapFb.get(id) ?? null
        ),
        medicine: medMap.get(id) as unknown as MedicineResult,
      }))
      .filter(r => r.medicine)
      .slice(0, topK)
  }

  // If no keyword/trigram results, use filtered semantic
  if (keywordResults.length === 0 && trigramResults.length === 0) {
    return filteredSemanticResults
      .map(r => ({
        score: honestScore(r.score, null, null),
        medicine: normalizeMedicine(r.medicine) as MedicineResult,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  // RRF fusion com 3 fontes
  const semanticRank = new Map(filteredSemanticResults.map((r, i) => [r.medicine.id, i + 1]))
  const keywordRank = new Map(keywordResults.map((r, i) => [r.medicineId, i + 1]))
  const trigramRank = new Map(trigramResults.map((r, i) => [r.medicineId, i + 1]))

  const allIds = new Set([
    ...filteredSemanticResults.map(r => r.medicine.id),
    ...keywordResults.map(r => r.medicineId),
    ...trigramResults.map(r => r.medicineId),
  ])

  const scores = [...allIds].map(id => ({
    id,
    rrfScore:
      (SEMANTIC_WEIGHT / (RRF_K + (semanticRank.get(id) ?? Infinity))) +
      (KEYWORD_WEIGHT / (RRF_K + (keywordRank.get(id) ?? Infinity))) +
      (TRIGRAM_WEIGHT / (RRF_K + (trigramRank.get(id) ?? Infinity))),
  }))

  scores.sort((a, b) => b.rrfScore - a.rrfScore)
  const topIds = scores.slice(0, topK).map(s => s.id)

  const existingMedicines = filteredSemanticResults
    .filter(r => topIds.includes(r.medicine.id))
    .map(r => r.medicine)

  const remainingIds = topIds.filter(id => !existingMedicines.some(m => m.id === id))
  if (remainingIds.length > 0) {
    const remaining = await prisma.medicine.findMany({ where: { id: { in: remainingIds } } })
    existingMedicines.push(...remaining.map(normalizeMedicine) as unknown as MedicineResult[])
  }

  const medMap = new Map(existingMedicines.map(m => [m.id, m]))
  const semanticScoreMap = new Map(filteredSemanticResults.map(r => [r.medicine.id, r.score]))
  const keywordScoreMap = new Map(keywordResults.map(r => [r.medicineId, r.keywordScore]))
  const trigramScoreMap = new Map(trigramResults.map(r => [r.medicineId, r.trigramScore]))

  const initialResults = topIds
    .map(id => ({
      score: honestScore(
        semanticScoreMap.get(id) ?? null,
        keywordScoreMap.get(id) ?? null,
        trigramScoreMap.get(id) ?? null
      ),
      medicine: medMap.get(id)!,
    }))
    .filter(r => r.medicine)

  // Filtro de falsos positivos por substring + boost por match exato
  const filteredResults = initialResults.map(r => {
    const hasKeyword = keywordIds.has(r.medicine.id)
    const hasTrigram = trigramIds.has(r.medicine.id)

    // Remover falsos positivos de substring curta
    if (isSubstringFalsePositive(query, r.medicine, hasKeyword, hasTrigram)) {
      return { ...r, score: r.score * 0.05 }
    }

    // Boost por match exato no nome
    const boost = nameMatchBoost(query, r.medicine)
    return { ...r, score: r.score + boost }
  }).sort((a, b) => b.score - a.score)

  // Penalidade para resultados sem keyword/trigram support nem relação textual
  let keywordVerifiedIds = new Set<number>()
  if (keywordResults.length > 0) {
    const tsquery = buildExpandedTsquery(query)
    if (tsquery) {
      const allResultIds = filteredResults.map(r => r.medicine.id)
      if (allResultIds.length > 0) {
        interface IdRow { id: number }
        const verified = await prisma.$queryRawUnsafe<IdRow[]>(
          `SELECT id FROM medicines WHERE id = ANY($1::int[]) AND "search_document" @@ to_tsquery('portuguese', $2::text)`,
          allResultIds,
          tsquery
        )
        keywordVerifiedIds = new Set(verified.map(r => r.id))
      }
    }
  }

  const penalizedResults = filteredResults.map(r => {
    const hasKeyword = keywordVerifiedIds.has(r.medicine.id)
    const hasTrigram = trigramIds.has(r.medicine.id)
    if (hasKeyword || hasTrigram) return r
    if (!medicineRelatesToQuery(r.medicine, queryTerms)) {
      return { ...r, score: r.score * 0.1 }
    }
    return r
  }).sort((a, b) => b.score - a.score)

  // Aplicar ajustes de score baseados em feedback dos usuários
  const adjustedResults = await applyScoreAdjustments(query, penalizedResults)

  const totalMs = (performance.now() - t0).toFixed(0)
  console.log(
    `[search] "${query}" → ${adjustedResults.length} results ` +
    `(${searchMs}ms search, ${totalMs}ms total) ` +
    `[${classification.type}] ` +
    `[sem:${semanticResults.length} kw:${keywordResults.length} tri:${trigramResults.length}]`
  )

  // Salvar no cache
  setCachedSearch(query, topK, adjustedResults)

  return adjustedResults
}
