'use server'

import { prisma } from "@/lib/prisma"
import { keywordSearch } from '@/lib/actions/keyword-search'
import { EMBEDDING } from '@/lib/config'
import { normalizeMedicine } from "@/lib/format"
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
  topK: number = 20
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

  const rows = await prisma.$transaction(async (tx) => {
    // idx_medicines_embedding is an ivfflat index with 180 lists; the default
    // probes=1 only scans ~1/180 of the vectors, causing near-empty/irrelevant
    // results. Bump it for this query only (SET LOCAL scopes to the transaction).
    await tx.$executeRawUnsafe(`SET LOCAL ivfflat.probes = 20`)
    return tx.$queryRawUnsafe<{ id: number; semantic_score: number }[]>(
      sql,
      vecStr,
      topK,
    )
  })

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

// The UI renders `score` directly as a "%" relevance indicator. Raw cosine
// similarity can be negative and raw RRF scores top out around 0.033, so
// neither is meaningful as-is — normalize to the top score within this
// result set (best match = 100%) before returning.
function normalizeScores<T extends { score: number }>(results: T[]): T[] {
  if (results.length === 0) return results
  const max = Math.max(...results.map(r => r.score))
  if (max <= 0) return results.map(r => ({ ...r, score: 0 }))
  return results.map(r => ({ ...r, score: Math.max(r.score, 0) / max }))
}

export async function hybridSearch(
  query: string,
  topK: number = 20
): Promise<{ score: number; medicine: MedicineResult }[]> {
  if (!query.trim()) return []

  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, topK * 2),
    keywordSearch(query, topK * 2),
  ])

  if (semanticResults.length === 0) {
    const ids = keywordResults.map(r => r.medicineId)
    if (ids.length === 0) return []
    const medicines = await prisma.medicine.findMany({ where: { id: { in: ids } } })
    const medMap = new Map(medicines.map(m => [m.id, m]))
    return normalizeScores(
      keywordResults
        .map(r => ({
          score: r.keywordScore,
          medicine: medMap.get(r.medicineId) as unknown as MedicineResult,
        }))
        .filter(r => r.medicine)
        .slice(0, topK)
    )
  }

  if (keywordResults.length === 0) {
    return normalizeScores(
      semanticResults.slice(0, topK).map(r => ({
        ...r,
        medicine: normalizeMedicine(r.medicine) as MedicineResult,
      }))
    )
  }

  const semanticRank = new Map(semanticResults.map((r, i) => [r.medicine.id, i + 1]))
  const keywordRank = new Map(keywordResults.map(r => [r.medicineId, 0]))
  keywordResults.forEach((r, i) => keywordRank.set(r.medicineId, i + 1))

  const allIds = new Set([
    ...semanticResults.map(r => r.medicine.id),
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

  const existingMedicines = semanticResults
    .filter(r => topIds.includes(r.medicine.id))
    .map(r => r.medicine)

  const remainingIds = topIds.filter(id => !existingMedicines.some(m => m.id === id))
  if (remainingIds.length > 0) {
    const remaining = await prisma.medicine.findMany({ where: { id: { in: remainingIds } } })
    existingMedicines.push(...remaining.map(normalizeMedicine) as unknown as MedicineResult[])
  }

  const medMap = new Map(existingMedicines.map(m => [m.id, m]))
  const scoreMap = new Map(scores.map(s => [s.id, s.rrfScore]))

  return normalizeScores(
    topIds
      .map(id => ({
        score: scoreMap.get(id) ?? 0,
        medicine: medMap.get(id)!,
      }))
      .filter(r => r.medicine)
  )
}
