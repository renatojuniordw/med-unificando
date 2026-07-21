import fs from 'fs'
import path from 'path'
import { EMBEDDING } from '@/lib/config'
import { getPharmaceuticalFormName } from '@/lib/dictionaries/pharmaceutical-forms'
import { getAtcDescription } from '@/lib/dictionaries/atc-codes'
import { getPrescriptionTypeName } from '@/lib/dictionaries/prescription-types'

export interface EmbeddingSourceMedicine {
  id: number
  tradeName: string
  activeIngredient: string
  pharmaceuticalForm: string
  therapeuticClass: string | null
  concentration: string
  synonyms: string | null
  indications: string | null
  category: string | null
  similarHolder: string
  status: string | null
  reference: string
  atcCode: string | null
  prescriptionType: string | null
  farmaciaPopular: boolean
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
  env.cacheDir = '/tmp/.transformers-cache'
  const extractor = await pipeline('feature-extraction', EMBEDDING.MODEL)

  const texts = medicines.map(m => {
    const pharmFormName = getPharmaceuticalFormName(m.pharmaceuticalForm)
    const atcDesc = getAtcDescription(m.atcCode)
    const prescTypeName = getPrescriptionTypeName(m.prescriptionType)
    return [
      m.tradeName,
      m.activeIngredient,
      pharmFormName,
      m.therapeuticClass,
      atcDesc,
      m.indications,
      m.synonyms,
      m.concentration,
      m.category,
      prescTypeName,
      m.similarHolder,
      m.status === 'Ativo' ? 'ativo' : 'inativo',
      m.farmaciaPopular ? 'farmacia popular' : null,
    ].filter(Boolean).join(' | ')
  })

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
