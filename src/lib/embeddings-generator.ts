import fs from 'fs'
import path from 'path'

export interface EmbeddingSourceMedicine {
  id: number
  tradeName: string
  activeIngredient: string
  category: string | null
  similarHolder: string
  pharmaceuticalForm: string
  concentration: string
  status: string | null
  synonyms: string | null
  indications: string | null
  reference: string
}

export interface GenerateEmbeddingsResult {
  count: number
  dim: number
  binSizeBytes: number
}

const DIM = 384
const BATCH = 50

export async function generateEmbeddings(
  medicines: EmbeddingSourceMedicine[],
  outputDir: string,
  onProgress?: (done: number, total: number) => void
): Promise<GenerateEmbeddingsResult> {
  const { pipeline } = await import('@xenova/transformers')
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

  const texts = medicines.map(m =>
    [m.tradeName, m.activeIngredient, m.category, m.similarHolder,
     m.pharmaceuticalForm, m.concentration, m.synonyms, m.indications,
     m.status === 'Ativo' ? 'ativo' : 'inativo', m.reference]
      .filter(Boolean).join(' | ')
  )

  const embeddings: number[] = []

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH)
    const result = await extractor(batch, { pooling: 'mean', normalize: true })
    const data = result.data as Float32Array

    for (let j = 0; j < batch.length; j++) {
      for (let d = 0; d < DIM; d++) {
        embeddings.push(data[j * DIM + d] ?? 0)
      }
    }

    onProgress?.(Math.min(i + BATCH, texts.length), texts.length)
  }

  const header = { count: medicines.length, dim: DIM, ids: medicines.map(m => m.id) }
  const buf = Buffer.alloc(embeddings.length * 4)
  for (let i = 0; i < embeddings.length; i++) buf.writeFloatLE(embeddings[i], i * 4)

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'embeddings-header.json'), JSON.stringify(header))
  fs.writeFileSync(path.join(outputDir, 'embeddings.bin'), buf)

  extractor.dispose()

  return { count: medicines.length, dim: DIM, binSizeBytes: buf.length }
}
