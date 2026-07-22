import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getPharmaceuticalFormName } from "../src/lib/dictionaries/pharmaceutical-forms"
import { getAtcDescription } from "../src/lib/dictionaries/atc-codes"
import { getPrescriptionTypeName } from "../src/lib/dictionaries/prescription-types"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

interface MedicineRow {
  id: number
  tradeName: string
  activeIngredient: string
  pharmaceuticalForm: string
  concentration: string
  category: string | null
  similarHolder: string
  status: string | null
  synonyms: string | null
  indications: string | null
  therapeuticClass: string | null
  atcCode: string | null
  prescriptionType: string | null
  farmaciaPopular: boolean
}

const BATCH = 500

function buildText(m: MedicineRow): string {
  const pharmForm = getPharmaceuticalFormName(m.pharmaceuticalForm)
  const atcDesc = getAtcDescription(m.atcCode)
  const prescType = getPrescriptionTypeName(m.prescriptionType)
  const parts = [
    m.tradeName,
    m.activeIngredient,
    pharmForm,
    m.therapeuticClass,
    atcDesc,
    m.indications,
    m.synonyms,
    m.concentration,
    m.category,
    prescType,
    m.similarHolder,
    m.status === "Ativo" ? "ativo" : "inativo",
    m.farmaciaPopular ? "farmacia popular" : null,
  ].filter(Boolean).join(" ")
  return parts
}

async function main() {
  console.log("Buscando medicamentos sem search_document...")
  const ids = await prisma.$queryRawUnsafe<{ id: number }[]>(
    'SELECT id FROM medicines WHERE "search_document" IS NULL ORDER BY id ASC'
  )
  
  const idList = ids.map(r => r.id)
  if (idList.length === 0) {
    console.log("Todos os medicamentos já possuem search_document. Nada a fazer.")
    await prisma.$disconnect()
    return
  }
  
  console.log(`Total: ${idList.length} medicamentos sem search_document`)

  const medicines = await prisma.medicine.findMany({
    where: { id: { in: idList } },
    orderBy: { id: "asc" },
    select: {
      id: true, tradeName: true, activeIngredient: true,
      pharmaceuticalForm: true, concentration: true, category: true,
      similarHolder: true, status: true, synonyms: true, indications: true,
      therapeuticClass: true, atcCode: true, prescriptionType: true,
      farmaciaPopular: true,
    },
  }) as unknown as MedicineRow[]

  console.log("Gerando search_document (tsvector)...")
  let done = 0

  for (let i = 0; i < medicines.length; i += BATCH) {
    const batch = medicines.slice(i, i + BATCH)
    const updates = batch.map(m => {
      const text = buildText(m).replace(/'/g, "''")
      return `WHEN ${m.id} THEN to_tsvector('portuguese', '${text}')`
    }).join(" ")

    await prisma.$executeRawUnsafe(
      `UPDATE medicines SET "search_document" = CASE id ${updates} END WHERE id IN (${batch.map(m => m.id).join(",")})`
    )

    done += batch.length
    if (done % 2000 === 0 || done >= medicines.length) {
      console.log(`${done}/${medicines.length} tsvectors gerados`)
    }
  }

  console.log("Concluído!")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())