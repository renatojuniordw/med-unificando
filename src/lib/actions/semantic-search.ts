'use server'

import { prisma } from "@/lib/prisma"
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
