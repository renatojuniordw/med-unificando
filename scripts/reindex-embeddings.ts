import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { EMBEDDING } from "../src/lib/config"
import { getPharmaceuticalFormName } from "../src/lib/dictionaries/pharmaceutical-forms"
import { getAtcDescription } from "../src/lib/dictionaries/atc-codes"
import { getPrescriptionTypeName } from "../src/lib/dictionaries/prescription-types"

// Re-indexa TODOS os medicamentos com o novo modelo de embedding
// Uso: npx tsx scripts/reindex-embeddings.ts

const DIM = EMBEDDING.DIMS
const EMBEDDING_COL = EMBEDDING.COLUMN
const BATCH_SIZE = 50
const RETRY_COUNT = 3
const DELAY_MS = 100

interface MedicineRow {
  id: number
  reference: string
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
  atcCode: string | null
  prescriptionType: string | null
  farmaciaPopular: boolean
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

function buildDocumentText(m: MedicineRow): string {
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
    m.status === "Ativo" ? "ativo" : "inativo",
    m.farmaciaPopular ? "farmacia popular" : null,
  ]
    .filter(Boolean)
    .join(" | ")
  return `passage: ${parts}`
}

async function main() {
  console.log(`Re-indexando embeddings com modelo ${EMBEDDING.MODEL} (${DIM} dims)...`)
  console.log(`Coluna destino: ${EMBEDDING_COL}`)

  const countRow = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*)::int AS count FROM medicines`
  )
  const total = countRow[0].count
  console.log(`Total: ${total} medicamentos`)

  // Carregar todos os IDs
  const allIds = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM medicines ORDER BY id ASC`
  )
  const idList = allIds.map(r => r.id)

  // Carregar em lotes (findMany tem limite de IN clause)
  const medicines: MedicineRow[] = []
  const CHUNK = 5000
  for (let i = 0; i < idList.length; i += CHUNK) {
    const chunk = idList.slice(i, i + CHUNK)
    const batch = await prisma.medicine.findMany({
      where: { id: { in: chunk } },
      orderBy: { id: "asc" },
      select: {
        id: true, reference: true, tradeName: true, activeIngredient: true,
        category: true, similarHolder: true, pharmaceuticalForm: true,
        concentration: true, status: true, synonyms: true, indications: true,
        therapeuticClass: true, atcCode: true, prescriptionType: true,
        farmaciaPopular: true,
      },
    })
    medicines.push(...batch as unknown as MedicineRow[])
  }

  console.log(`Carregando modelo (${EMBEDDING.MODEL})...`)
  const { pipeline, env } = await import("@xenova/transformers")
  env.cacheDir = "/tmp/.transformers-cache"
  const extractor = await pipeline("feature-extraction", EMBEDDING.MODEL)

  let done = 0
  let failed = 0

  console.log("Gerando e salvando embeddings...")

  async function saveBatch(updates: { id: number; vec: number[] }[]): Promise<boolean> {
    for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
      try {
        const cases = updates.map(({ id, vec }) =>
          `WHEN ${id} THEN '[${vec.join(",")}]'::vector`
        ).join(" ")
        const ids = updates.map(u => u.id)
        await prisma.$executeRawUnsafe(
          `UPDATE medicines SET "${EMBEDDING_COL}" = CASE id ${cases} END WHERE id = ANY($1::int[])`,
          ids
        )
        return true
      } catch (err) {
        console.warn(`  [WARN] Tentativa ${attempt + 1} falhou: ${(err as Error).message?.slice(0, 100)}`)
        if (attempt < RETRY_COUNT - 1) {
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    }
    return false
  }

  for (let i = 0; i < medicines.length; i += BATCH_SIZE) {
    const batch = medicines.slice(i, i + BATCH_SIZE)
    const texts = batch.map(buildDocumentText)

    const result = await extractor(texts, { pooling: "mean", normalize: true })
    const data = result.data as Float32Array

    const updates = batch.map((m, j) => {
      const start = j * DIM
      const vec = Array.from(data.subarray(start, start + DIM))
      return { id: m.id, vec }
    })

    const ok = await saveBatch(updates)
    if (!ok) failed += batch.length

    done += batch.length
    if (done % 1000 === 0 || done >= total) {
      console.log(`${done}/${total} embeddings gerados e salvos${failed > 0 ? ` (${failed} falhas)` : ''}`)
    }

    await new Promise(r => setTimeout(r, DELAY_MS))
  }

  extractor.dispose()
  console.log("\nRe-indexacao concluida!")
  console.log(`Proximo passo: rodar prisma migrate para renomear a coluna (Fase final da migracao)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
