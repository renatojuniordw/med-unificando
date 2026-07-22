'use server'

import { prisma } from "@/lib/prisma"
import { keywordSearch } from '@/lib/actions/keyword-search'
import { EMBEDDING } from '@/lib/config'
import { normalizeMedicine } from "@/lib/format"
import { applyScoreAdjustments } from "@/lib/score-adjustments"
import type { MedicineResult } from "@/types"
import type { FeatureExtractionPipeline } from "@xenova/transformers"

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

  const sql = `
    SELECT id, 1 - (embedding <=> $1::vector) AS semantic_score
    FROM medicines
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `

  // 30s timeout for large vector search
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL ivfflat.probes = 40`)
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

const RRF_K = 60

// Absolute cosine-similarity floor
const SEMANTIC_HARD_MIN = 0.80

// Cosine similarity at/above which a semantic match is trusted standalone,
// without needing keyword corroboration.
const SEMANTIC_STRONG = 0.855

const SEMANTIC_CEILING = 0.92

// Keyword saturation — how much ts_rank fills the keyword component
const KEYWORD_SATURATION = 0.15

const SEMANTIC_WEIGHT = 0.50
const KEYWORD_WEIGHT = 0.50

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function passesSemanticGate(score: number, hasKeywordSupport: boolean): boolean {
  if (score < SEMANTIC_HARD_MIN) return false
  if (score >= SEMANTIC_STRONG) return true // passa sem keyword support
  return hasKeywordSupport // precisa de keyword
}

function semanticComponent(cosine: number): number {
  return clamp((cosine - SEMANTIC_HARD_MIN) / (SEMANTIC_CEILING - SEMANTIC_HARD_MIN), 0, 1)
}

function keywordComponent(tsRank: number): number {
  return Math.min(tsRank / KEYWORD_SATURATION, 1)
}

function honestScore(semanticRaw: number | null, keywordRaw: number | null): number {
  const sem = semanticRaw !== null ? semanticComponent(semanticRaw) : null
  const kw = keywordRaw !== null ? keywordComponent(keywordRaw) : null

  if (sem !== null && kw !== null) {
    return SEMANTIC_WEIGHT * sem + KEYWORD_WEIGHT * kw
  }

  // Apenas semântico (sem keyword support) — redutor de confiança
  if (sem !== null) return sem * 0.80

  // Apenas keyword
  if (kw !== null) return kw * 0.80

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

export async function hybridSearch(
  query: string,
  topK: number = 20
): Promise<{ score: number; medicine: MedicineResult }[]> {
  if (!query.trim()) return []

  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, topK * 5),
    keywordSearch(query, topK * 5),
  ])

  const keywordIds = new Set(keywordResults.map(r => r.medicineId))
  const queryTerms = extractQueryTerms(query)

  // Filter semantic results: pass through gate, then verify relation
  const filteredSemanticResults = semanticResults.filter(r => {
    const hasKeyword = keywordIds.has(r.medicine.id)
    // Pass the semantic gate
    if (!passesSemanticGate(r.score, hasKeyword)) return false
    return true
  })

  // If no semantic results remain, fall back to keyword-only
  if (filteredSemanticResults.length === 0) {
    if (keywordResults.length === 0) return []
    const ids = keywordResults.map(r => r.medicineId)
    const medicines = await prisma.medicine.findMany({ where: { id: { in: ids } } })
    const medMap = new Map(medicines.map(m => [m.id, m]))
    return keywordResults
      .map(r => ({
        score: honestScore(null, r.keywordScore),
        medicine: medMap.get(r.medicineId) as unknown as MedicineResult,
      }))
      .filter(r => r.medicine)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  // If no keyword results, use filtered semantic
  if (keywordResults.length === 0) {
    return filteredSemanticResults
      .map(r => ({
        score: honestScore(r.score, null),
        medicine: normalizeMedicine(r.medicine) as MedicineResult,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  // RRF fusion
  const semanticRank = new Map(filteredSemanticResults.map((r, i) => [r.medicine.id, i + 1]))
  const keywordRank = new Map(keywordResults.map(r => [r.medicineId, 0]))
  keywordResults.forEach((r, i) => keywordRank.set(r.medicineId, i + 1))

  const allIds = new Set([
    ...filteredSemanticResults.map(r => r.medicine.id),
    ...keywordResults.map(r => r.medicineId),
  ])

  const scores = [...allIds].map(id => ({
    id,
    rrfScore:
      (1 / (RRF_K + (semanticRank.get(id) ?? Infinity))) +
      (1 / (RRF_K + (keywordRank.get(id) ?? Infinity))),
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

  const initialResults = topIds
    .map(id => ({
      score: honestScore(semanticScoreMap.get(id) ?? null, keywordScoreMap.get(id) ?? null),
      medicine: medMap.get(id)!,
    }))
    .filter(r => r.medicine)
    .sort((a, b) => b.score - a.score)
  
  // Penalidade para resultados sem keyword support nem relação textual
  // Usa query expandida com sinônimos para verificar no banco
  let keywordVerifiedIds = new Set<number>()
  if (keywordResults.length > 0) {
    const { buildExpandedTsquery } = await import('@/lib/keyword-utils')
    const tsquery = buildExpandedTsquery(query)
    if (tsquery) {
      const allResultIds = initialResults.map(r => r.medicine.id)
      if (allResultIds.length > 0) {
        interface IdRow { id: number }
        const verified = await prisma.$queryRawUnsafe<IdRow[]>(
          `SELECT id FROM medicines WHERE id IN (${allResultIds.join(',')}) AND "search_document" @@ to_tsquery('portuguese', $1::text)`,
          tsquery
        )
        keywordVerifiedIds = new Set(verified.map(r => r.id))
      }
    }
  }
  
  const penalizedResults = initialResults.map(r => {
    const hasKeyword = keywordVerifiedIds.has(r.medicine.id)
    if (hasKeyword) return r
    if (!medicineRelatesToQuery(r.medicine, queryTerms)) {
      return { ...r, score: r.score * 0.1 }
    }
    return r
  }).sort((a, b) => b.score - a.score)

  // Aplicar ajustes de score baseados em feedback dos usuários
  const adjustedResults = await applyScoreAdjustments(query, penalizedResults)

  return adjustedResults
}
