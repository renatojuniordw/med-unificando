import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as XLSX from "xlsx"
import iconv from "iconv-lite"
import bcrypt from "bcryptjs"

import https from "https"
import { anvisaAgent } from "../src/lib/anvisa-https"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const CSV_URL = 'https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV'
const THERAPEUTIC_CLASS_URL = 'https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv'

function fetchAnvisa(url: string, maxRedirects = 3): Promise<{ text: string; lastModified: Date }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent: anvisaAgent }, (res) => {
      if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        res.resume()
        return fetchAnvisa(res.headers.location, maxRedirects - 1).then(resolve, reject)
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Erro HTTP: ${res.statusCode} ${res.statusMessage}`))
        return
      }
      const lastModifiedStr = res.headers['last-modified']
      const lastModified = lastModifiedStr ? new Date(lastModifiedStr) : new Date()
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const text = iconv.decode(Buffer.concat(chunks), 'latin1')
        resolve({ text, lastModified })
      })
      res.on('error', reject)
    })
    req.on('error', reject)
  })
}

const VALID_CATEGORIES = new Set([
  'SIMILAR', 'GENÉRICO', 'REFERÊNCIA', 'NOVO', 'ESPECÍFICO',
  'FITOTERÁPICO', 'BIOLÓGICO', 'DINAMIZADO', 'BAIXO RISCO',
  'GASES MEDICINAIS', 'RADIOFÁRMACO',
])

function buildTherapeuticClassMap(rows: Record<string, string>[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of rows) {
    const reference = String(row['NUMERO_REGISTRO_PRODUTO'] ?? '').trim()
    const therapeuticClass = (row['CLASSE_TERAPEUTICA'] ?? '').trim()
    if (reference && therapeuticClass) map.set(reference, therapeuticClass)
  }
  return map
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.log("ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos no .env")
    process.exit(1)
  }

  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!adminExists) {
    const password = bcrypt.hashSync(adminPassword, 10)

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        role: "ADMIN",
        password,
      },
    })

    console.log(`Admin criado: ${adminEmail}`)
  } else {
    console.log("Admin já existe")
  }

  const medicineCount = await prisma.medicine.count()
  if (medicineCount > 0) {
    console.log(`Banco já possui ${medicineCount} medicamentos. Pulando import.`)
    console.log("Use a interface admin para sincronizar com a ANVISA.")
    return
  }

  console.log("Baixando dados abertos da ANVISA...")
  const { text: csvText, lastModified: remoteTimestamp } = await fetchAnvisa(CSV_URL)

  console.log("Parseando CSV...")
  const workbook = XLSX.read(csvText, { type: 'string', raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  console.log(`Total de linhas no CSV: ${rows.length}`)

  console.log("Baixando classes terapêuticas da ANVISA...")
  let therapeuticClassByReference = new Map<string, string>()
  try {
    const { text: classCsvText } = await fetchAnvisa(THERAPEUTIC_CLASS_URL)
    const classWorkbook = XLSX.read(classCsvText, { type: 'string', raw: true })
    const classSheet = classWorkbook.Sheets[classWorkbook.SheetNames[0]]
    const classRows: Record<string, string>[] = XLSX.utils.sheet_to_json(classSheet, { defval: '' })
    therapeuticClassByReference = buildTherapeuticClassMap(classRows)
    console.log(`Classes terapêuticas encontradas: ${therapeuticClassByReference.size}`)
  } catch (err) {
    console.log(`Aviso: falha ao baixar classes terapêuticas: ${err instanceof Error ? err.message : 'erro desconhecido'}. Prosseguindo sem elas.`)
  }

  const medicines: Array<Record<string, unknown>> = []
  const now = new Date()

  for (const row of rows) {
    const reference = (row['NU_REGISTRO_PRODUTO'] ?? '').trim()
    if (!reference) continue

    const category = (row['DS_TIPO_CATEGORIA_REGULATORIA'] ?? '').trim()
    if (category && !VALID_CATEGORIES.has(category.toUpperCase())) continue

    medicines.push({
      reference,
      activeIngredient: (row['SUBSTANCIAS_MEDICAMENTOS'] ?? '').trim(),
      tradeName: (row['NO_PRODUTO'] ?? '').trim(),
      similarHolder: (row['NO_RAZAO_SOCIAL_EMPRESA'] ?? '').trim(),
      pharmaceuticalForm: (row['CO_FORMA_FISICA'] ?? '').trim(),
      concentration: (row['COMPLEMENTO'] ?? '').trim(),
      inclusionDate: (row['DATA_PUBLICACAO'] ?? '').trim().split(' ')[0],
      category,
      referenceMedicine: (row['DS_REFERENCIA'] ?? '').trim(),
      atcCode: (row['CO_ATC'] ?? '').trim(),
      prescriptionType: (row['CO_TARJA'] ?? '').trim(),
      status: (row['VALIDADE_SITUACAO'] ?? '').trim(),
      authorization: (row['AUTORIZACAO_MEDICAMENTO'] ?? '').trim(),
      presentationCount: parseInt((row['NUMERO_APRESENTACOES'] ?? '').trim(), 10) || 0,
      synonyms: (row['SINONIMOS'] ?? '').trim(),
      indications: (row['INDICACOES'] ?? '').trim(),
      therapeuticClass: therapeuticClassByReference.get(reference) ?? null,
      anvisaFileDate: remoteTimestamp,
      lastImportAt: now,
    })
  }

  console.log(`Importando ${medicines.length} medicamentos...`)

  const batchSize = 500
  for (let i = 0; i < medicines.length; i += batchSize) {
    const batch = medicines.slice(i, i + batchSize)
    await prisma.medicine.createMany({ data: batch as never })
    if ((i + batchSize) % 2000 === 0 || i + batchSize >= medicines.length) {
      console.log(`${Math.min(i + batchSize, medicines.length)} importados...`)
    }
  }

  console.log(`Seed concluído! ${medicines.length} medicamentos importados da ANVISA.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
