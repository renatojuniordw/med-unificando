import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as XLSX from "xlsx"
import https from "https"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const URL = "https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv"

async function main() {
  console.log("Baixando preços CMED...")
  const csvText = await new Promise<string>((resolve, reject) => {
    https.get(URL, { rejectUnauthorized: false }, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (c: Buffer) => chunks.push(c))
      res.on("end", () => resolve(Buffer.concat(chunks).toString()))
      res.on("error", reject)
    }).on("error", reject)
  })

  console.log("Parseando...")
  const workbook = XLSX.read(csvText, { type: "string", raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })
  console.log(`Total de linhas: ${rows.length}`)

  const prices: Array<Record<string, unknown>> = []
  for (const row of rows) {
    const reg = (row["NU_REGISTRO"] ?? "").trim()
    if (!reg) continue
    const reference = reg.substring(0, 9)
    const pf0 = parseFloat((row["NU_PF0_INTEIRO"] ?? "").replace(",", "."))
    const pf18 = parseFloat((row["NU_PF18_INTEIRO"] ?? "").replace(",", "."))
    prices.push({
      reference,
      cnpj: (row["NU_CNPJ"] ?? "").trim(),
      company: (row["NO_RAZAO_SOCIAL"] ?? "").trim(),
      productName: (row["NO_PRODUTO"] ?? "").trim(),
      presentation: (row["DS_APRESENTACAO"] ?? "").trim(),
      substance: (row["DS_SUBSTANCIA"] ?? "").trim(),
      pf0Price: isNaN(pf0) ? null : pf0,
      pf18Price: isNaN(pf18) ? null : pf18,
      hospitalOnly: (row["ST_REST_HOSP"] ?? "").trim(),
    })
  }

  console.log(`Importando ${prices.length} preços...`)
  await prisma.price.deleteMany()

  const batchSize = 500
  for (let i = 0; i < prices.length; i += batchSize) {
    await prisma.price.createMany({ data: prices.slice(i, i + batchSize) as never })
    if ((i + batchSize) % 5000 === 0 || i + batchSize >= prices.length) {
      console.log(`${Math.min(i + batchSize, prices.length)} importados...`)
    }
  }

  const total = await prisma.price.count()
  console.log(`Concluído! ${total} preços importados.`)
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect())
