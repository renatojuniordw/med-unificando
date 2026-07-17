import "dotenv/config"
import { pipeline } from "@xenova/transformers"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const OUTPUT_DIR = path.resolve(__dirname, "../public")

async function main() {
  console.log("Carregando modelo de embedding (all-MiniLM-L6-v2)...")
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")

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

  const texts = medicines.map(m =>
    [m.tradeName, m.activeIngredient, m.category, m.similarHolder,
     m.pharmaceuticalForm, m.concentration, m.synonyms, m.indications,
     m.status === "Ativo" ? "ativo" : "inativo", m.reference]
      .filter(Boolean).join(" | ")
  )

  const DIM = 384
  const embeddings: number[] = []
  const BATCH = 50

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH)
    const result = await extractor(batch, { pooling: "mean", normalize: true })
    const data = result.data as Float32Array

    for (let j = 0; j < batch.length; j++) {
      for (let d = 0; d < DIM; d++) {
        embeddings.push(data[j * DIM + d] ?? 0)
      }
    }

    const done = Math.min(i + BATCH, texts.length)
    if (done % 1000 === 0 || done >= texts.length) {
      console.log(`${done}/${texts.length} embeddings gerados`)
    }
  }

  const header = { count: medicines.length, dim: DIM, ids: medicines.map(m => m.id) }
  const buf = Buffer.alloc(embeddings.length * 4)
  for (let i = 0; i < embeddings.length; i++) buf.writeFloatLE(embeddings[i], i * 4)

  fs.writeFileSync(path.join(OUTPUT_DIR, "embeddings-header.json"), JSON.stringify(header))
  fs.writeFileSync(path.join(OUTPUT_DIR, "embeddings.bin"), buf)

  const binSize = fs.statSync(path.join(OUTPUT_DIR, "embeddings.bin")).size
  console.log(`\nConcluído! ${medicines.length} medicamentos, ${(binSize / 1024 / 1024).toFixed(1)} MB (${DIM}d)`)

  extractor.dispose()
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
