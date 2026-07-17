import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20', 10), 100)
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
    const rows = data.map((m: Record<string, unknown>) => [
      m.reference, m.activeIngredient, m.tradeName, m.similarHolder,
      m.pharmaceuticalForm, m.concentration, m.category, m.atcCode, m.prescriptionType, m.status,
    ])
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="medicamentos-${page}.csv"`,
      },
    })
  }

  return NextResponse.json({
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}
