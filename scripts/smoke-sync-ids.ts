import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { planDiff, type DiffRow } from "../src/lib/sync-diff"

// Smoke test da promessa central do diff: IDs estáveis entre syncs.
// 1) Carrega os medicamentos reais (id + campos de conteúdo);
// 2) roda planDiff com os MESMOS dados → deve dar 100% unchanged;
// 3) roda planDiff com 1 alteração → deve devolver UPDATE com um id EXISTENTE.
// Nada é gravado no banco (é read-only).
const CONTENT_KEYS = [
  'reference', 'activeIngredient', 'tradeName', 'similarHolder',
  'pharmaceuticalForm', 'concentration', 'inclusionDate', 'category',
  'referenceMedicine', 'atcCode', 'prescriptionType', 'status', 'authorization',
  'presentationCount', 'synonyms', 'indications', 'therapeuticClass',
] as const

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

async function main() {
  const rows = await prisma.medicine.findMany({
    select: { id: true, ...Object.fromEntries(CONTENT_KEYS.map(k => [k, true])) },
  }) as unknown as DiffRow[]

  console.log(`Medicamentos no banco: ${rows.length}`)

  // 1) mesmo dataset → unchanged total
  const same = planDiff(rows, rows.map(({ id, ...rest }) => rest) as never, [...CONTENT_KEYS], 'reference')
  console.log(`[1] mesmo payload → unchanged=${same.unchanged}, toCreate=${same.toCreate.length}, toDelete=${same.toDeleteIds.length}, toUpdate=${same.toUpdate.length}`)
  if (same.unchanged !== rows.length) throw new Error(`FALHA: esperava ${rows.length} unchanged, veio ${same.unchanged}`)

  // 2) 1 alteração (tradeName do primeiro) → UPDATE com id existente
  const altered = rows.map(({ id, ...rest }) => ({ ...rest }))
  altered[0] = { ...altered[0], tradeName: `${altered[0].tradeName} (alterado)` }
  const diff = planDiff(rows, altered as never, [...CONTENT_KEYS], 'reference')
  const updatedIds = diff.toUpdate.map(u => u.id)
  const existingIdSet = new Set(rows.map(r => r.id))
  const allExisting = updatedIds.every(id => existingIdSet.has(id))
  console.log(`[2] 1 alteração → toUpdate=${diff.toUpdate.length} (todos com id existente? ${allExisting}), toCreate=${diff.toCreate.length}, toDelete=${diff.toDeleteIds.length}`)
  if (diff.toUpdate.length !== 1 || !allExisting) throw new Error('FALHA: diff não preservou o id na alteração')

  console.log('OK: IDs preservados — URLs /medicamento/{id} sobrevivem a re-syncs.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })