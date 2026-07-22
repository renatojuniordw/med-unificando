import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  // Teste 1: raw tsquery
  console.log("=== Teste 1: tsquery direta ===")
  const r1 = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM medicines WHERE "search_document" @@ to_tsquery('portuguese', 'estomago | gastrico | antiacido | azia | refluxo | gastrite | ulcera | omeprazol | pantoprazol | esomeprazol')`
  )
  console.log("Resultados com tsquery OR expandida:", r1[0]?.count)

  // Teste 2: plainto_tsquery
  console.log("\n=== Teste 2: plainto_tsquery ===")
  const r2 = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM medicines WHERE "search_document" @@ plainto_tsquery('portuguese', 'remédio para estômago')`
  )
  console.log("Resultados com plainto_tsquery:", r2[0]?.count)

  // Teste 3: buscar por estomago (sem acento)
  console.log("\n=== Teste 3: termo simples 'estomago' ===")
  const r3 = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM medicines WHERE "search_document" @@ to_tsquery('portuguese', 'estomago')`
  )
  console.log("Resultados para 'estomago':", r3[0]?.count)

  // Teste 4: buscar por omeprazol
  console.log("\n=== Teste 4: termo 'omeprazol' ===")
  const r4 = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM medicines WHERE "search_document" @@ to_tsquery('portuguese', 'omeprazol')`
  )
  console.log("Resultados para 'omeprazol':", r4[0]?.count)

  // Teste 5: 10 exemplos de resultados
  console.log("\n=== Teste 5: 5 exemplos com tsquery OR ===")
  const r5 = await prisma.$queryRawUnsafe<{ id: number; tradeName: string }[]>(
    `SELECT id, "tradeName" FROM medicines WHERE "search_document" @@ to_tsquery('portuguese', 'estomago | gastrico | antiacido') LIMIT 5`
  )
  r5.forEach(r => console.log(`  ${r.id}: ${r.tradeName}`))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())