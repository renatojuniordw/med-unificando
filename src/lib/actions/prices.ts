'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import * as XLSX from 'xlsx'
import https from 'https'

const PRICES_URL = 'https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv'
const agent = new https.Agent({ rejectUnauthorized: false })

export async function syncPrices() {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Não autorizado' }

  try {
    const csvText = await new Promise<string>((resolve, reject) => {
      https.get(PRICES_URL, { agent }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks).toString()))
        res.on('error', reject)
      }).on('error', reject)
    })

    const workbook = XLSX.read(csvText, { type: 'string', raw: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    const prices: Array<Record<string, unknown>> = []

    for (const row of rows) {
      const reg = (row['NU_REGISTRO'] ?? '').trim()
      if (!reg) continue

      const reference = reg.substring(0, 9)
      const pf0 = parseFloat((row['NU_PF0_INTEIRO'] ?? '').replace(',', '.'))
      const pf18 = parseFloat((row['NU_PF18_INTEIRO'] ?? '').replace(',', '.'))

      prices.push({
        reference,
        cnpj: (row['NU_CNPJ'] ?? '').trim(),
        company: (row['NO_RAZAO_SOCIAL'] ?? '').trim(),
        productName: (row['NO_PRODUTO'] ?? '').trim(),
        presentation: (row['DS_APRESENTACAO'] ?? '').trim(),
        substance: (row['DS_SUBSTANCIA'] ?? '').trim(),
        pf0Price: isNaN(pf0) ? null : pf0,
        pf18Price: isNaN(pf18) ? null : pf18,
        hospitalOnly: (row['ST_REST_HOSP'] ?? '').trim(),
      })
    }

    await prisma.price.deleteMany()

    const batchSize = 500
    for (let i = 0; i < prices.length; i += batchSize) {
      await prisma.price.createMany({ data: prices.slice(i, i + batchSize) as never })
    }

    return { success: true, count: prices.length, message: `${prices.length} preços importados!` }
  } catch (error) {
    return { success: false, error: `Erro: ${error instanceof Error ? error.message : 'desconhecido'}` }
  }
}

export async function getPriceStats() {
  const total = await prisma.price.count()
  const withPrice = await prisma.price.count({ where: { pf0Price: { not: null } } })
  return { total, withPrice }
}
