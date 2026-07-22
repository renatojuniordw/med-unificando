import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MEDICINE_LIMITS } from '@/lib/constants'
import { normalizeMedicine } from '@/lib/format'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20', 10), MEDICINE_LIMITS.MAX_PAGE_SIZE)
  const reference = searchParams.get('reference')
  const activeIngredient = searchParams.get('activeIngredient')
  const tradeName = searchParams.get('tradeName')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const format = searchParams.get('format')

  const where: Record<string, unknown> = {}
  if (reference) where.reference = { contains: reference, mode: 'insensitive' }
  if (activeIngredient) where.activeIngredient = { contains: activeIngredient, mode: 'insensitive' }
  if (tradeName) where.tradeName = { contains: tradeName, mode: 'insensitive' }
  if (category) where.category = category
  if (status) where.status = status

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
}
