import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MEDICINE_LIMITS } from '@/lib/constants'
import { normalizeMedicine } from '@/lib/format'
import { buildWhere } from '@/lib/build-where'
import { MEDICINE_EXPORT_HEADERS, medicineToExportRow, toCsv } from '@/lib/csv-export'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// Converte query string em inteiro positivo com fallback; evita NaN no Prisma.
function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = value ? Number.parseInt(value, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(ip, 'medicines-api', { limit: 60 })
  if (!rl.allowed) {
    return rateLimitResponse(rl)
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const pageSize = Math.min(parsePositiveInt(searchParams.get('pageSize'), 20), MEDICINE_LIMITS.MAX_PAGE_SIZE)
    const reference = searchParams.get('reference')
    const activeIngredient = searchParams.get('activeIngredient')
    const tradeName = searchParams.get('tradeName')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const format = searchParams.get('format')

    const where = buildWhere({
      reference: reference ?? undefined,
      activeIngredient: activeIngredient ?? undefined,
      tradeName: tradeName ?? undefined,
      category: category ?? undefined,
      status: status ?? undefined,
    })

    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      prisma.medicine.findMany({ where, skip, take: pageSize, orderBy: { reference: 'asc' } }),
      prisma.medicine.count({ where }),
    ])

    if (format === 'csv') {
      const rows = data.map(normalizeMedicine).map(medicineToExportRow)
      const csv = toCsv(MEDICINE_EXPORT_HEADERS, rows)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="medicamentos-${page}.csv"`,
        },
      })
    }

    const normalizedData = data.map(normalizeMedicine)
    return NextResponse.json({
      data: normalizedData,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar medicamentos' },
      { status: 500 }
    )
  }
}
