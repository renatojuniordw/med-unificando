import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { THERAPEUTIC_CLASS_INDICATIONS } from "../src/lib/dictionaries/therapeutic-class-indications"

const DB_BATCH_SIZE = 500

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  // Idempotency: only touch rows where indications is genuinely empty AND a
  // therapeuticClass mapping exists. Never overwrite a non-empty indications
  // value (protects any future ANVISA data or manual admin edits) and never
  // write anything for a therapeuticClass with no mapping entry.
  const candidates = await prisma.medicine.findMany({
    where: {
      OR: [{ indications: null }, { indications: '' }],
      therapeuticClass: { not: null },
    },
    select: { id: true, therapeuticClass: true },
    orderBy: { id: 'asc' },
  })

  const unmapped = new Set<string>()
  const updates: { id: number; text: string }[] = []

  for (const m of candidates) {
    const tc = (m.therapeuticClass ?? '').trim()
    const text = THERAPEUTIC_CLASS_INDICATIONS[tc]
    if (!text) {
      if (tc) unmapped.add(tc)
      continue
    }
    updates.push({ id: m.id, text })
  }

  console.log(`${candidates.length} linhas candidatas, ${updates.length} serão atualizadas, ${unmapped.size} valores de therapeuticClass sem entrada no dicionário.`)

  if (unmapped.size > 0) {
    console.warn('therapeuticClass sem entrada no dicionário (indications não preenchido para estes):')
    for (const tc of [...unmapped].sort()) console.warn(`  - ${tc}`)
  }

  let done = 0
  for (let i = 0; i < updates.length; i += DB_BATCH_SIZE) {
    const batch = updates.slice(i, i + DB_BATCH_SIZE)
    const cases = batch.map(u => `WHEN ${u.id} THEN '${u.text.replace(/'/g, "''")}'`).join(' ')
    await prisma.$executeRawUnsafe(
      `UPDATE medicines SET indications = CASE id ${cases} END WHERE id IN (${batch.map(u => u.id).join(',')})`
    )
    done += batch.length
    console.log(`${done}/${updates.length} linhas atualizadas`)
  }

  console.log('Concluído.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
