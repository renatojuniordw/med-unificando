import type { PrismaClient } from "@/generated/prisma/client"
import { getPharmaceuticalFormName } from "@/lib/dictionaries/pharmaceutical-forms"
import { getAtcDescription } from "@/lib/dictionaries/atc-codes"
import { getPrescriptionTypeName } from "@/lib/dictionaries/prescription-types"

export interface MedicineSearchRow {
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

// Texto de busca de alta qualidade: resolve códigos brutos (forma farmacêutica,
// ATC, tipo de prescrição) para nomes compreensíveis — a fonte autoritativa do
// tsvector. O trigger em produção cobre o gap imediato (busca nunca vazia após
// sync); esta função é o refinamento que regera todos com os nomes resolvidos.
export function buildSearchText(m: MedicineSearchRow): string {
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

async function findRows(prisma: PrismaClient, whereSql: string): Promise<MedicineSearchRow[]> {
  return prisma.$queryRawUnsafe<MedicineSearchRow[]>(
    `SELECT id, "tradeName", "activeIngredient", "pharmaceuticalForm", "concentration",
            category, "similarHolder", status, synonyms, indications,
            "therapeuticClass", "atcCode", "prescriptionType", "farmaciaPopular"
     FROM medicines
     ${whereSql}
     ORDER BY id ASC`
  )
}

async function applyVectors(prisma: PrismaClient, rows: MedicineSearchRow[]): Promise<number> {
  let done = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const updates = batch.map(m => {
      const text = buildSearchText(m).replace(/'/g, "''")
      return `WHEN ${m.id} THEN to_tsvector('portuguese', '${text}')`
    }).join(" ")

    await prisma.$executeRawUnsafe(
      `UPDATE medicines SET "search_document" = CASE id ${updates} END WHERE id IN (${batch.map(m => m.id).join(",")})`
    )
    done += batch.length
  }
  return done
}

// Regenera o tsvector de TODOS os medicamentos (usado após o sync para elevar a
// qualidade dos vetores que o trigger gerou com campos crus).
export async function refreshTsvector(prisma: PrismaClient): Promise<number> {
  const rows = await findRows(prisma, '')
  return applyVectors(prisma, rows)
}

// Preenche apenas registros sem search_document (migração/manutenção manual).
export async function generateMissingTsvectors(prisma: PrismaClient): Promise<number> {
  const rows = await findRows(prisma, 'WHERE "search_document" IS NULL')
  return applyVectors(prisma, rows)
}