import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { EMBEDDING } from "../src/lib/config"
import { getPharmaceuticalFormName } from "../src/lib/dictionaries/pharmaceutical-forms"
import { getAtcDescription } from "../src/lib/dictionaries/atc-codes"
import { getPrescriptionTypeName } from "../src/lib/dictionaries/prescription-types"

const DIM = 384
const BATCH_SIZE = 50

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
  console.log("Buscando medicamentos...")
  const medicines = (await prisma.medicine.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      reference: true,
      tradeName: true,
      activeIngredient: true,
      category: true,
      similarHolder: true,
      pharmaceuticalForm: true,
      concentration: true,
      status: true,
      synonyms: true,
      indications: true,
      therapeuticClass: true,
      atcCode: true,
      prescriptionType: true,
      farmaciaPopular: true,
    },
  })) as unknown as MedicineRow[]
  console.log(`Total: ${medicines.length} medicamentos`)

  console.log(`Carregando modelo de embedding (${EMBEDDING.MODEL})...`)
  const { pipeline, env } = await import("@xenova/transformers")
  env.cacheDir = "/tmp/.transformers-cache"
  const extractor = await pipeline("feature-extraction", EMBEDDING.MODEL)

  const texts = medicines.map(buildDocumentText)
  const total = texts.length
  let done = 0

  console.log("Gerando e salvando embeddings...")
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + BATCH_SIZE)
    const batchMedicines = medicines.slice(i, i + BATCH_SIZE)

    const result = await extractor(batchTexts, { pooling: "mean", normalize: true })
    const data = result.data as Float32Array

    const updates = batchMedicines.map((m, j) => {
      const start = j * DIM
      const embedding = Array.from(data.subarray(start, start + DIM))
      const vectorStr = `[${embedding.join(",")}]`
      return prisma.$executeRawUnsafe(
        "UPDATE medicines SET embedding = $1::vector WHERE id = $2",
        vectorStr,
        m.id,
      )
    })
    await prisma.$transaction(updates)

    done += batchMedicines.length
    if (done % 1000 === 0 || done >= total) {
      console.log(`${done}/${total} embeddings gerados e salvos`)
    }
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
