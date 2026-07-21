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
}

const DIM = 384
const EMBEDDING_BATCH_SIZE = 50

function buildDocumentText(m: EmbeddingSourceMedicine): string {
  const pharmFormName = getPharmaceuticalFormName(m.pharmaceuticalForm)
  const atcDesc = getAtcDescription(m.atcCode)
  const prescTypeName = getPrescriptionTypeName(m.prescriptionType)
  const parts = [
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
  return `passage: ${parts}`
}

export async function generateEmbeddings(
  medicines: EmbeddingSourceMedicine[],
  _outputDir: string,
  onProgress?: (done: number, total: number) => void
): Promise<GenerateEmbeddingsResult> {
  const { pipeline, env } = await import('@xenova/transformers')
  env.cacheDir = '/tmp/.transformers-cache'
  const extractor = await pipeline('feature-extraction', EMBEDDING.MODEL)

  for (let i = 0; i < medicines.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = medicines.slice(i, i + EMBEDDING_BATCH_SIZE)
    const texts = batch.map(buildDocumentText)
    const result = await extractor(texts, { pooling: 'mean', normalize: true })
    const data = result.data as Float32Array

    const cases = batch.map((m, j) => {
      const start = j * DIM
      const vec = Array.from(data.subarray(start, start + DIM))
      return `WHEN ${m.id} THEN '${JSON.stringify(vec)}'::vector`
    }).join(' ')

    const { prisma } = await import('@/lib/prisma')
    await prisma.$executeRawUnsafe(
      `UPDATE medicines SET embedding = CASE id ${cases} END WHERE id IN (${batch.map(m => m.id).join(',')})`,
    )

    onProgress?.(Math.min(i + EMBEDDING_BATCH_SIZE, medicines.length), medicines.length)
  }

  extractor.dispose()
  return { count: medicines.length }
}
