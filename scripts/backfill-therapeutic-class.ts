import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as XLSX from "xlsx"
import iconv from "iconv-lite"
import https from "https"
import { ANVISA } from "../src/lib/config"

const agent = new https.Agent({ rejectUnauthorized: false })
const BATCH_SIZE = 500

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

function downloadCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (chunk: Buffer) => chunks.push(chunk))
      res.on("end", () => resolve(iconv.decode(Buffer.concat(chunks), "latin1")))
      res.on("error", reject)
    }).on("error", reject)
  })
}

function buildTherapeuticClassMap(rows: Record<string, string>[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of rows) {
    const reference = String(row["NUMERO_REGISTRO_PRODUTO"] ?? "").trim()
    const therapeuticClass = (row["CLASSE_TERAPEUTICA"] ?? "").trim()
    if (reference && therapeuticClass) map.set(reference, therapeuticClass)
  }
  return map
}

async function main() {
  console.log(`Baixando ${ANVISA.THERAPEUTIC_CLASS_URL}...`)
  const csvText = await downloadCSV(ANVISA.THERAPEUTIC_CLASS_URL)
  const sanitized = csvText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  const workbook = XLSX.read(sanitized, { type: "string", raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })
  console.log(`CSV: ${rows.length} linhas`)

  const classByReference = buildTherapeuticClassMap(rows)
  console.log(`Mapa reference -> classe terapêutica: ${classByReference.size} entradas`)

  const dbReferences = await prisma.$queryRawUnsafe<{ reference: string }[]>(
    `SELECT DISTINCT reference FROM medicines`
  )
  console.log(`Referências distintas no banco: ${dbReferences.length}`)

  const toUpdate = dbReferences
    .map(r => ({ reference: r.reference, therapeuticClass: classByReference.get(r.reference) }))
    .filter((r): r is { reference: string; therapeuticClass: string } => !!r.therapeuticClass)

  console.log(`Referências com classe terapêutica encontrada: ${toUpdate.length} (${(toUpdate.length / dbReferences.length * 100).toFixed(1)}%)`)

  if (process.argv.includes("--dry-run")) {
    console.log("Dry run — nenhuma alteração feita. Amostra:")
    console.log(toUpdate.slice(0, 10))
    await prisma.$disconnect()
    return
  }

  let updatedRows = 0
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE)
    const values = batch
      .map((_, j) => `($${j * 2 + 1}::text, $${j * 2 + 2}::text)`)
      .join(", ")
    const params = batch.flatMap(r => [r.reference, r.therapeuticClass])

    const result = await prisma.$executeRawUnsafe(
      `UPDATE medicines m SET "therapeuticClass" = v.class
       FROM (VALUES ${values}) AS v(reference, class)
       WHERE m.reference = v.reference AND (m."therapeuticClass" IS DISTINCT FROM v.class)`,
      ...params,
    )
    updatedRows += result as number

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= toUpdate.length) {
      console.log(`${Math.min(i + BATCH_SIZE, toUpdate.length)}/${toUpdate.length} referências processadas (${updatedRows} linhas atualizadas até agora)`)
    }
  }

  console.log(`\nConcluído! ${updatedRows} linhas de medicamentos atualizadas com classe terapêutica.`)

  let nulledTotal = 0
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE)
    const refs = batch.map((_, j) => `$${j + 1}::text`).join(", ")
    const nulled = await prisma.$executeRawUnsafe(
      `UPDATE medicines SET embedding = NULL WHERE reference IN (${refs})`,
      ...batch.map(r => r.reference),
    )
    nulledTotal += nulled as number
  }
  console.log(`${nulledTotal} embeddings invalidados para regeneração (rode "npm run search-index" em seguida).`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
