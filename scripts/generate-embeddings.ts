import "dotenv/config"
import * as tf from '@tensorflow/tfjs'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const OUTPUT_DIR = path.resolve(__dirname, "../public")

async function main() {
  console.log("Carregando modelo USE...")
  await tf.ready()
  const model = await use.load()

  console.log("Buscando medicamentos...")
  const medicines = await prisma.medicine.findMany({
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
    },
  })
  console.log(`Total: ${medicines.length} medicamentos`)

  const texts = medicines.map(m => {
    return [
      m.tradeName,
      m.activeIngredient,
      m.category,
      m.similarHolder,
      m.pharmaceuticalForm,
      m.concentration,
      m.status === "Ativo" ? "ativo" : "inativo",
      m.reference,
    ].filter(Boolean).join(" | ")
  })

  const DIM = 512
  const embeddings: number[] = []
  const BATCH = 50

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH)
    const result = await model.embed(batch)
    const values = await result.array()
    result.dispose()

    for (const vec of values as number[][]) {
      for (let d = 0; d < DIM; d++) {
        embeddings.push(vec[d] ?? 0)
      }
    }

    if ((i + BATCH) % 500 === 0 || i + BATCH >= texts.length) {
      console.log(`${Math.min(i + BATCH, texts.length)}/${texts.length} embeddings gerados`)
    }
  }

  const ids = medicines.map(m => m.id)
  const totalEmbeddings = ids.length
  const header = { count: totalEmbeddings, dim: DIM, ids }

  const binaryBuffer = Buffer.alloc(embeddings.length * 4)
  for (let i = 0; i < embeddings.length; i++) {
    binaryBuffer.writeFloatLE(embeddings[i], i * 4)
  }

  const headerPath = path.join(OUTPUT_DIR, "embeddings-header.json")
  const dataPath = path.join(OUTPUT_DIR, "embeddings.bin")

  fs.writeFileSync(headerPath, JSON.stringify(header))
  fs.writeFileSync(dataPath, binaryBuffer)

  const headerSize = fs.statSync(headerPath).size
  const binSize = fs.statSync(dataPath).size

  console.log(`\nConcluído!`)
  console.log(`Header: ${(headerSize / 1024).toFixed(1)} KB (${totalEmbeddings} medicamentos)`)
  console.log(`Embeddings: ${(binSize / 1024 / 1024).toFixed(1)} MB (${DIM} dimensões, float32)`)

  model.dispose()
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
