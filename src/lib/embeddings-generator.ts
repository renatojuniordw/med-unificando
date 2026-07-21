import fs from 'fs'
import path from 'path'
import { EMBEDDING } from '@/lib/config'

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
  therapeuticClass: string | null
  reference: string
}

export interface GenerateEmbeddingsResult {
  count: number
  dim: number
  binSizeBytes: number
}

const DIM = 384
const EMBEDDING_BATCH_SIZE = 50

function writeEmbeddingFiles(header: { count: number; dim: number; ids: number[] }, buffer: Buffer, outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'embeddings-header.json'), JSON.stringify(header))
  fs.writeFileSync(path.join(outputDir, 'embeddings.bin'), buffer)
}

export async function generateEmbeddings(
  medicines: EmbeddingSourceMedicine[],
  outputDir: string,
  onProgress?: (done: number, total: number) => void
): Promise<GenerateEmbeddingsResult> {
  const { pipeline, env } = await import('@xenova/transformers')
  env.cacheDir = '/app/.transformers-cache'
  const extractor = await pipeline('feature-extraction', EMBEDDING.MODEL)

  const texts = medicines.map(m =>
    [m.tradeName, m.activeIngredient, m.category, m.similarHolder,
     m.therapeuticClass, m.concentration, m.synonyms, m.indications,
     m.status === 'Ativo' ? 'ativo' : 'inativo', m.reference]
      .filter(Boolean).join(' | ')
  )

  const embeddingValues: number[] = []

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE)
    const result = await extractor(batch, { pooling: 'mean', normalize: true })
    const data = result.data as Float32Array

    for (let j = 0; j < batch.length; j++) {
      for (let d = 0; d < DIM; d++) {
        embeddingValues.push(data[j * DIM + d] ?? 0)
      }
    }

    onProgress?.(Math.min(i + EMBEDDING_BATCH_SIZE, texts.length), texts.length)
  }

  const header = { count: medicines.length, dim: DIM, ids: medicines.map(m => m.id) }
  const buf = Buffer.alloc(embeddingValues.length * 4)
  for (let i = 0; i < embeddingValues.length; i++) buf.writeFloatLE(embeddingValues[i], i * 4)

  writeEmbeddingFiles(header, buf, outputDir)

  extractor.dispose()

  return { count: medicines.length, dim: DIM, binSizeBytes: buf.length }
}
