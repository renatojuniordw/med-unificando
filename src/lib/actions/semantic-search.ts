'use server'

import { prisma } from "@/lib/prisma"
import { keywordSearch } from '@/lib/actions/keyword-search'
import type { MedicineResult } from "@/types"
import type { FeatureExtractionPipeline } from "@xenova/transformers"

let extractor: FeatureExtractionPipeline | null = null
let embeddings: Float32Array | null = null
let header: { count: number; dim: number; ids: number[] } | null = null

async function getModel() {
  if (!extractor) {
    const { pipeline, env } = await import("@xenova/transformers")
    env.cacheDir = "/tmp/.transformers-cache"
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
  }
  return extractor
}

async function getEmbeddings() {
  if (header && embeddings) return { header, embeddings }

  const fs = await import("fs")
  const path = await import("path")

  const headerPath = path.join(process.cwd(), "public", "embeddings", "embeddings-header.json")
  const binPath = path.join(process.cwd(), "public", "embeddings", "embeddings.bin")

  header = JSON.parse(fs.readFileSync(headerPath, "utf-8"))
  const buffer = fs.readFileSync(binPath)
  embeddings = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4)

  return { header, embeddings }
}

export async function clearEmbeddingsCache() {
  header = null
  embeddings = null
}

function cosineSimilarity(a: Float32Array, b: Float32Array, dim: number): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < dim; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
}

export async function semanticSearch(
  query: string,
  topK: number = 20
): Promise<{ score: number; medicine: MedicineResult }[]> {
  if (!query.trim()) return []

  const model = await getModel()
  const { header: h, embeddings: embs } = await getEmbeddings()

  if (!h || !embs) return []

  const result = await model(query, { pooling: "mean", normalize: true })
  const queryEmb = result.data as Float32Array

  const scores: { index: number; score: number }[] = []

  for (let i = 0; i < h.count; i++) {
    const offset = i * h.dim
    const vec = embs.slice(offset, offset + h.dim)
    const score = cosineSimilarity(queryEmb, vec, h.dim)
    scores.push({ index: i, score })
  }

  scores.sort((a, b) => b.score - a.score)
  const topScores = scores.slice(0, topK)
  const topIds = topScores.map(s => h.ids[s.index])

  const medicines = await prisma.medicine.findMany({
    where: { id: { in: topIds } },
  })

  const medMap = new Map(medicines.map(m => [m.id, m]))

  return topScores
    .map(s => ({
      score: s.score,
      medicine: medMap.get(h.ids[s.index]) as unknown as MedicineResult,
    }))
    .filter(r => r.medicine)
    .sort((a, b) => {
      const aActive = a.medicine.status === 'Ativo' ? 0 : 1
      const bActive = b.medicine.status === 'Ativo' ? 0 : 1
      return aActive - bActive || b.score - a.score
    })
}

const RRF_K = 60

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
    return keywordResults
      .map(r => ({
        score: r.keywordScore,
        medicine: medMap.get(r.medicineId) as unknown as MedicineResult,
      }))
      .filter(r => r.medicine)
      .slice(0, topK)
  }

  if (keywordResults.length === 0) {
    return semanticResults.slice(0, topK)
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
    existingMedicines.push(...remaining as unknown as MedicineResult[])
  }

  const medMap = new Map(existingMedicines.map(m => [m.id, m]))
  const scoreMap = new Map(scores.map(s => [s.id, s.rrfScore]))

  return topIds
    .map(id => ({
      score: scoreMap.get(id) ?? 0,
      medicine: medMap.get(id)!,
    }))
    .filter(r => r.medicine)
}
