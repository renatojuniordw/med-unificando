import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import path from "path"
import { generateEmbeddings } from "../src/lib/embeddings-generator"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const OUTPUT_DIR = path.resolve(__dirname, "../public/embeddings")

async function main() {
  console.log("Buscando medicamentos...")
  const medicines = await prisma.medicine.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true, reference: true, tradeName: true, activeIngredient: true,
      category: true, similarHolder: true, pharmaceuticalForm: true,
      concentration: true, status: true, synonyms: true, indications: true,
    },
  })
  console.log(`Total: ${medicines.length} medicamentos`)

  console.log("Carregando modelo de embedding (all-MiniLM-L6-v2) e gerando embeddings...")
  const result = await generateEmbeddings(medicines, OUTPUT_DIR, (done, total) => {
    if (done % 1000 === 0 || done >= total) {
      console.log(`${done}/${total} embeddings gerados`)
    }
  })

  console.log(`\nConcluído! ${result.count} medicamentos, ${(result.binSizeBytes / 1024 / 1024).toFixed(1)} MB (${result.dim}d)`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
