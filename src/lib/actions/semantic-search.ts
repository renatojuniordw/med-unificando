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

// Absolute cosine-similarity floor: below this, a semantic-only match is
// unrelated noise regardless of its rank in this particular result set.
//
// Calibrated empirically (see scripts/tmp-test-search.ts / tmp-test-noise.ts
// during development): with multilingual-e5-small on this dataset, raw
// cosine similarity is heavily compressed and NOT a clean absolute
// discriminator on its own — legitimate matches range ~0.85-0.91 depending
// on the query, while fully unrelated/gibberish queries still score
// ~0.82-0.85. There is no single cutoff that perfectly separates the two, so
// this floor is intentionally conservative (a coarse safety net for
// degenerate queries), not the primary precision mechanism — that role
// belongs to keyword corroboration and, most importantly, to the
// `indications` data backfill (scripts/backfill-indications.ts), which is
// what actually fixed the reported "dor de cabeça" cross-contamination by
// giving the embedding real symptom text to disambiguate on.
const SEMANTIC_HARD_MIN = 0.80

// Cosine similarity at/above which a semantic match is trusted standalone,
// without needing keyword corroboration.
const SEMANTIC_STRONG = 0.855

// Practical ceiling used to stretch [SEMANTIC_HARD_MIN, SEMANTIC_CEILING]
// into [0, 1] for display. e5 cosine scores for near-exact matches cluster
// below 1.0 in practice, so 1.0 itself would be an unreachable ceiling.
const SEMANTIC_CEILING = 0.92

// ts_rank scores are unbounded and not comparable to cosine similarity; this
// saturates keyword strength into a 0-1 component. Observed ts_rank values
// in this dataset for real corroborating matches sit around 0.03-0.09.
const KEYWORD_SATURATION = 0.1

// Pesos de fusão otimizados para melhor relevância
// Ajustado para dar mais peso ao keyword quando disponível, pois ele é mais preciso
// para termos específicos (nomes de medicamentos, classes terapêuticas)
const SEMANTIC_WEIGHT = 0.60
const KEYWORD_WEIGHT = 0.40

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// A weak semantic match with no keyword backing is unrelated noise (e.g. an
// anticonvulsant drifting toward "dor de cabeça" purely via broad "sistema
// nervoso" vocabulary overlap in embedding space) — require either a strong
// standalone similarity or corroboration from the keyword search, which
// already filters correctly on its own.
function passesSemanticGate(score: number, hasKeywordSupport: boolean): boolean {
  if (score < SEMANTIC_HARD_MIN) return false
  if (score >= SEMANTIC_STRONG) return true
  return hasKeywordSupport
}

function semanticComponent(cosine: number): number {
  return clamp((cosine - SEMANTIC_HARD_MIN) / (SEMANTIC_CEILING - SEMANTIC_HARD_MIN), 0, 1)
}

function keywordComponent(tsRank: number): number {
  return Math.min(tsRank / KEYWORD_SATURATION, 1)
}

// The displayed "%" must mean roughly the same thing across different
// queries — an absolute confidence estimate, not "how this ranked relative to
// the best result in this particular result set" (which is what the old
// top-1-relative normalization produced).
function honestScore(semanticRaw: number | null, keywordRaw: number | null): number {
  const sem = semanticRaw !== null ? semanticComponent(semanticRaw) : null
  const kw = keywordRaw !== null ? keywordComponent(keywordRaw) : null
  
  // Se ambos estão disponíveis, usa os pesos otimizados
  if (sem !== null && kw !== null) {
    return SEMANTIC_WEIGHT * sem + KEYWORD_WEIGHT * kw
  }
  
  // Se só tem semântico, aplica um fator de redução (keyword é mais confiável)
  if (sem !== null) return sem * 0.85
  
  // Se só tem keyword, usa ele puro
  if (kw !== null) return kw
  
  return 0
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

  const keywordIds = new Set(keywordResults.map(r => r.medicineId))
  // A weak semantic-only match (no keyword corroboration) below SEMANTIC_STRONG
  // is dropped here, before it can win a rank slot in RRF purely by being
  // less-bad than other weak matches.
  const filteredSemanticResults = semanticResults.filter(r =>
    passesSemanticGate(r.score, keywordIds.has(r.medicine.id))
  )

  if (filteredSemanticResults.length === 0) {
    const ids = keywordResults.map(r => r.medicineId)
    if (ids.length === 0) return []
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

  if (keywordResults.length === 0) {
    return filteredSemanticResults
      .map(r => ({
        score: honestScore(r.score, null),
        medicine: normalizeMedicine(r.medicine) as MedicineResult,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

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

  return topIds
    .map(id => ({
      score: honestScore(semanticScoreMap.get(id) ?? null, keywordScoreMap.get(id) ?? null),
      medicine: medMap.get(id)!,
    }))
    .filter(r => r.medicine)
    .sort((a, b) => b.score - a.score)
}
