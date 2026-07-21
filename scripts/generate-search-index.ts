import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { EMBEDDING } from "../src/lib/config"
import { getPharmaceuticalFormName } from "../src/lib/dictionaries/pharmaceutical-forms"
import { getAtcDescription } from "../src/lib/dictionaries/atc-codes"
import { getPrescriptionTypeName } from "../src/lib/dictionaries/prescription-types"

const DIM = 384
const BATCH_SIZE = 50
const DB_BATCH_SIZE = 100
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
  console.log("Buscando medicamentos sem embedding...")
  const ids = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM medicines WHERE embedding IS NULL ORDER BY id ASC`
  )
  const idList = ids.map(r => r.id)

  if (idList.length === 0) {
    console.log("Todos os medicamentos já possuem embedding. Nada a fazer.")
    await prisma.$disconnect()
    return
  }
  console.log(`Total: ${idList.length} medicamentos sem embedding`)

  const medicines = (await prisma.medicine.findMany({
    where: { id: { in: idList } },
    orderBy: { id: "asc" },
    select: {
      id: true, reference: true, tradeName: true, activeIngredient: true,
      category: true, similarHolder: true, pharmaceuticalForm: true,
      concentration: true, status: true, synonyms: true, indications: true,
      therapeuticClass: true, atcCode: true, prescriptionType: true,
      farmaciaPopular: true,
    },
  })) as unknown as MedicineRow[]

  console.log(`Carregando modelo de embedding (${EMBEDDING.MODEL})...`)
  const { pipeline, env } = await import("@xenova/transformers")
  env.cacheDir = "/tmp/.transformers-cache"
  const extractor = await pipeline("feature-extraction", EMBEDDING.MODEL)

  const total = medicines.length
  let done = 0
  let failed = 0

  console.log("Gerando e salvando embeddings...")

  async function saveBatch(updates: { id: number; vec: number[] }[]): Promise<boolean> {
    for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
      try {
        const cases = updates.map(({ id, vec }) =>
          `WHEN ${id} THEN '[${vec.join(",")}]'::vector`
        ).join(" ")
        await prisma.$executeRawUnsafe(
          `UPDATE medicines SET embedding = CASE id ${cases} END WHERE id IN (${updates.map(u => u.id).join(",")})`
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

  for (let i = 0; i < total; i += BATCH_SIZE) {
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
  console.log("\nConcluído!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
