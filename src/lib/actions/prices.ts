'use server'

import { prisma } from "@/lib/prisma"
import { withAdmin, withAdminReturn } from "@/lib/auth-guard"
import { downloadCsv, parseCsvToRows } from "@/lib/csv-utils"
import { BATCH } from "@/lib/constants"
import { ANVISA } from "@/lib/config"

const PRICES_URL = ANVISA.PRICES_URL

export async function syncPrices() {
  return withAdmin(async () => {
    try {
      const csvText = await downloadCsv(PRICES_URL)
      const rows = parseCsvToRows(csvText)

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

      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('unificando_sync'))`

        await tx.price.deleteMany()

        const batchSize = BATCH.PRICE_IMPORT
        for (let i = 0; i < prices.length; i += batchSize) {
          await tx.price.createMany({ data: prices.slice(i, i + batchSize) as never })
        }

        await tx.syncLog.create({
          data: { type: 'prices', count: prices.length, status: 'success' },
        })
      }, { timeout: 120_000 })

      return { success: true, count: prices.length, message: `${prices.length} preços importados!` }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'desconhecido'
      await prisma.syncLog.create({
        data: { type: 'prices', count: 0, status: 'error', message },
      })
      return { success: false, error: `Erro: ${message}` }
    }
  })
}

export async function getPriceStats() {
  return withAdminReturn({ total: 0, withPrice: 0 }, async () => {
    const total = await prisma.price.count()
    const withPrice = await prisma.price.count({ where: { pf0Price: { not: null } } })
    return { total, withPrice }
  })
}
