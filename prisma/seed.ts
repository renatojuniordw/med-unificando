import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as XLSX from "xlsx"
import iconv from "iconv-lite"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const CSV_URL = 'https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV'

const VALID_CATEGORIES = new Set([
  'Similar', 'Genérico', 'Referência', 'Novo', 'Específico',
  'Fitoterápico', 'Biológico', 'Dinamizado', 'BAIXO RISCO',
  'DINAMIZADO', 'Gases Medicinais', 'Radiofármaco',
])

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
    const salt = bcrypt.genSaltSync(10)
    const password = bcrypt.hashSync(adminPassword, salt)

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        role: "ADMIN",
        password,
        salt,
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
  const resp = await fetch(CSV_URL)

  if (!resp.ok) {
    console.log(`Erro ao baixar CSV: ${resp.status} ${resp.statusText}`)
    return
  }

  const remoteDate = resp.headers.get('last-modified')
  const remoteTimestamp = remoteDate ? new Date(remoteDate) : new Date()
  const csvBuffer = Buffer.from(await resp.arrayBuffer())
  const csvText = iconv.decode(csvBuffer, 'latin1')

  console.log("Parseando CSV...")
  const workbook = XLSX.read(csvText, { type: 'string', raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  console.log(`Total de linhas no CSV: ${rows.length}`)

  const medicines: Array<Record<string, unknown>> = []
  const now = new Date()

  for (const row of rows) {
    const reference = (row['NU_REGISTRO_PRODUTO'] ?? '').trim()
    if (!reference) continue

    const category = (row['DS_TIPO_CATEGORIA_REGULATORIA'] ?? '').trim()
    if (category && !VALID_CATEGORIES.has(category)) continue

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
