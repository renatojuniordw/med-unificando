'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import * as XLSX from 'xlsx'
import https from 'https'
import iconv from 'iconv-lite'
import { BATCH } from "@/lib/constants"
import { ANVISA } from "@/lib/config"

const PRICES_URL = ANVISA.PRICES_URL
const agent = new https.Agent({ rejectUnauthorized: false })

export async function syncPrices() {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Não autorizado' }

  try {
    const csvText = await new Promise<string>((resolve, reject) => {
      https.get(PRICES_URL, { agent }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => resolve(iconv.decode(Buffer.concat(chunks), 'latin1')))
        res.on('error', reject)
      }).on('error', reject)
    })

    // xlsx@0.18.5 has known vulnerabilities. Risk mitigated: CSV from ANVISA (trusted source).
    const sanitized = csvText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    const workbook = XLSX.read(sanitized, { type: 'string', raw: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    const prices: Array<Record<string, unknown>> = []

    for (const row of rows) {
      const registrationNumber = (row['NU_REGISTRO'] ?? '').trim()
      if (!registrationNumber) continue

      const reference = registrationNumber.substring(0, 9)
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

    const batchSize = BATCH.PRICE_IMPORT
    for (let i = 0; i < prices.length; i += batchSize) {
      await prisma.price.createMany({ data: prices.slice(i, i + batchSize) as never })
    }

    await prisma.syncLog.create({
      data: { type: 'prices', count: prices.length, status: 'success' },
    })

    return { success: true, count: prices.length, message: `${prices.length} preços importados!` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'desconhecido'
    await prisma.syncLog.create({
      data: { type: 'prices', count: 0, status: 'error', message },
    })
    return { success: false, error: `Erro: ${message}` }
  }
}

export async function getPriceStats() {
  const total = await prisma.price.count()
  const withPrice = await prisma.price.count({ where: { pf0Price: { not: null } } })
  return { total, withPrice }
}
