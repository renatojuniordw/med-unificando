import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MEDICINE_LIMITS } from '@/lib/constants'
import { normalizeMedicine } from '@/lib/format'
import { buildWhere } from '@/lib/build-where'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(ip, 'medicines-api', { limit: 60 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') ?? '20', 10), 1), MEDICINE_LIMITS.MAX_PAGE_SIZE)
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
      const headers = [
        'referencia', 'principio_ativo', 'nome_comercial', 'detentor',
        'forma_farmaceutica', 'concentracao', 'categoria', 'codigo_atc', 'tarja', 'situacao',
      ]
      const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`
      const normalizedData = data.map(normalizeMedicine)
      const rows = normalizedData.map((m) => [
        m.reference, m.activeIngredient, m.tradeName, m.similarHolder,
        m.pharmaceuticalForm, m.concentration, m.category, m.atcCode, m.prescriptionType, m.status,
      ])
      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(escapeCsv).join(',')),
      ].join('\n')

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
