let embeddingModel: any = null
let embeddings: Float32Array | null = null
let header: { count: number; dim: number; ids: number[] } | null = null

async function loadModel() {
  if (embeddingModel) return embeddingModel
  const { pipeline } = await import('@xenova/transformers')
  embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return embeddingModel
}

export async function loadEmbeddings() {
  if (header && embeddings) return { header, embeddings }

  const [headerResp, binResp] = await Promise.all([
    fetch('/embeddings-header.json'),
    fetch('/embeddings.bin'),
  ])

  header = await headerResp.json()
  const buffer = await binResp.arrayBuffer()
  embeddings = new Float32Array(buffer)

  return { header, embeddings }
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
): Promise<{ id: number; score: number }[]> {
  const model = await loadModel()
  const { header: h, embeddings: embs } = await loadEmbeddings()
  if (!h || !embs) return []

  const result = await model(query, { pooling: 'mean', normalize: true })
  const queryEmb = result.data as Float32Array

  const scores: { id: number; score: number }[] = []

  for (let i = 0; i < h.count; i++) {
    const offset = i * h.dim
    const vec = embs.slice(offset, offset + h.dim)
    const score = cosineSimilarity(queryEmb, vec, h.dim)
    scores.push({ id: h.ids[i], score })
  }

  scores.sort((a, b) => b.score - a.score)
  return scores.slice(0, topK)
}
