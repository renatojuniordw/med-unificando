'use server'

import { prisma } from "@/lib/prisma"
import { buildWhere } from "@/lib/build-where"
import { YEARS } from "@/lib/constants"
import { normalizeMedicine } from "@/lib/format"
import * as Prisma from "@/generated/prisma/internal/prismaNamespace"
import type { SearchFilters, SearchResponse, DistinctValue, DashboardStats } from "@/types"
import { SEARCH } from "@/lib/config"

// Fragmento SQL único para extrair o ano da coluna "inclusionDate" (string).
// Usado em $queryRaw (via Prisma.raw) e $queryRawUnsafe (concatenação).
const INCLUSION_YEAR_SQL = 'substring("inclusionDate" from 7 for 4)'

export async function searchMedicines(
  page: number = 1,
  pageSize: number = 10,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const where = buildWhere(filters)
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { reference: 'asc' },
    }),
    prisma.medicine.count({ where }),
  ])

  return { data: data.map(normalizeMedicine), total, page, pageSize }
}

export async function getHolderMedicines(
  holder: string,
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  status?: string
): Promise<SearchResponse> {
  const where: Record<string, unknown> = {
    similarHolder: { contains: holder, mode: 'insensitive' },
  }
  if (search) {
    where.OR = [
      { tradeName: { contains: search, mode: 'insensitive' } },
      { activeIngredient: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = { equals: status, mode: 'insensitive' }

  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { tradeName: 'asc' },
    }),
    prisma.medicine.count({ where }),
  ])

  return { data: data.map(normalizeMedicine), total, page, pageSize }
}

/** Server-side autocomplete: busca valores que correspondem ao termo digitado */
export async function searchAutocomplete(field: string, q: string): Promise<DistinctValue[]> {
  const fieldToPrismaEnum: Record<string, Prisma.MedicineScalarFieldEnum> = {
    reference: Prisma.MedicineScalarFieldEnum.reference,
    activeIngredient: Prisma.MedicineScalarFieldEnum.activeIngredient,
    tradeName: Prisma.MedicineScalarFieldEnum.tradeName,
    similarHolder: Prisma.MedicineScalarFieldEnum.similarHolder,
    pharmaceuticalForm: Prisma.MedicineScalarFieldEnum.pharmaceuticalForm,
    category: Prisma.MedicineScalarFieldEnum.category,
    status: Prisma.MedicineScalarFieldEnum.status,
  }

  const fieldEnum = fieldToPrismaEnum[field]
  if (!fieldEnum || !q.trim()) return []

  const result = await prisma.medicine.findMany({
    select: { [field]: true },
    distinct: [fieldEnum],
    where: {
      [field]: { contains: q.trim(), mode: 'insensitive' },
    },
    take: SEARCH.AUTOCOMPLETE_TAKE,
    orderBy: { [field]: 'asc' },
  })

  return result
    .map((item) => ({ value: (item as Record<string, string>)[field] }))
    .filter((item) => item.value)
}

/** Agregados do detentor (total/ativos/categorias) sem carregar todas as linhas */
export async function getHolderSummary(holder: string): Promise<{ holderName: string; total: number; ativos: number; categoriasCount: number }> {
  const where: Prisma.MedicineWhereInput = {
    similarHolder: { contains: holder, mode: 'insensitive' },
  }

  const [first, total, ativos, categoriasCount] = await Promise.all([
    prisma.medicine.findFirst({ where, select: { similarHolder: true } }),
    prisma.medicine.count({ where }),
    prisma.medicine.count({ where: { ...where, status: 'Ativo' } }),
    prisma.medicine.groupBy({
      by: ['category'],
      where: { ...where, category: { not: null } },
      _count: { category: true },
    }).then(r => r.length),
  ])

  return {
    holderName: first?.similarHolder ?? holder,
    total,
    ativos,
    categoriasCount,
  }
}

/** Contagem rápida de medicamentos com os filtros atuais */
export async function countMedicines(filters: SearchFilters): Promise<number> {
  const where = buildWhere(filters)
  return prisma.medicine.count({ where })
}

async function computeTimeline() {
  const rows = await prisma.$queryRaw<{ year: string; count: number }[]>`
    SELECT ${Prisma.raw(INCLUSION_YEAR_SQL)} AS year, COUNT(*)::int AS count
    FROM medicines
    WHERE "inclusionDate" IS NOT NULL
      AND ${Prisma.raw(INCLUSION_YEAR_SQL)} BETWEEN ${YEARS.MIN} AND ${YEARS.MAX}
    GROUP BY year
    ORDER BY year ASC
  `
  return rows
}

async function computeTopReferences(count: number) {
  return prisma.medicine.groupBy({
    by: ['tradeName'],
    _count: { tradeName: true },
    orderBy: { _count: { tradeName: 'desc' } },
    take: count,
  }).then(r => r.map(item => ({ name: item.tradeName, count: item._count.tradeName })))
}

async function computeTopActiveIngredients(count: number) {
  return prisma.medicine.groupBy({
    by: ['activeIngredient'],
    _count: { activeIngredient: true },
    orderBy: { _count: { activeIngredient: 'desc' } },
    take: count,
  }).then(r => r.map(item => ({ name: item.activeIngredient, count: item._count.activeIngredient })))
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const timeline = await computeTimeline()
  const topK = SEARCH.DASHBOARD_TOP_K

  const [totalMedicines, totalTradeNames, topReferences, topActiveIngredients, groupByStatus, groupByCategory] = await Promise.all([
    prisma.medicine.count(),
    prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(DISTINCT "tradeName")::int AS count FROM medicines`
      .then(r => r[0]?.count ?? 0),
    computeTopReferences(topK),
    computeTopActiveIngredients(topK),
    prisma.medicine.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.medicine.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: SEARCH.DASHBOARD_TOP_K,
    }).then(r => r.map(item => ({ name: item.category ?? 'Sem categoria', count: item._count.category }))),
  ])

  const ativoCount = groupByStatus.find(statusItem => statusItem.status?.toLowerCase() === 'ativo' || statusItem.status === '')?._count.status ?? 0
  const inativoCount = groupByStatus.find(statusItem => statusItem.status?.toLowerCase() === 'inativo')?._count.status ?? 0

  return {
    totalMedicines,
    totalReferences: totalTradeNames,
    topReferences,
    topActiveIngredients,
    ativoCount,
    inativoCount,
    categories: groupByCategory,
    timeline,
    availableYears: timeline.map(t => t.year),
  }
}

export interface FilteredStats {
  total: number
  ativos: number
  inativos: number
  topTrade: { name: string; count: number }[]
  topIngredient: { name: string; count: number }[]
}

export async function getFilteredStats(filters: { year?: string; category?: string; status?: string }): Promise<FilteredStats> {
  const conditions: string[] = []
  const params: string[] = []
  if (filters.category) {
    params.push(filters.category)
    conditions.push(`"category" = $${params.length}`)
  }
  if (filters.status) {
    params.push(filters.status)
    conditions.push(`"status" = $${params.length}`)
  }
  if (filters.year) {
    params.push(filters.year)
    conditions.push(`${INCLUSION_YEAR_SQL} = $${params.length}`)
  }

  const commonWhere = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [totalResult, ativosResult, topTrade, topIngredient] = await Promise.all([
    prisma.$queryRawUnsafe<{ total: number }[]>(`SELECT COUNT(*)::int AS total FROM medicines ${commonWhere}`, ...params),
    prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*)::int AS count FROM medicines ${commonWhere} AND "status" = 'Ativo'`, ...params)
      .then(r => r[0]?.count ?? 0),
    prisma.$queryRawUnsafe<{ name: string; count: number }[]>(
      `SELECT "tradeName" AS name, COUNT(*)::int AS count
       FROM medicines ${commonWhere}
       GROUP BY "tradeName"
       ORDER BY count DESC
       LIMIT ${SEARCH.DASHBOARD_TOP_K}`,
      ...params
    ),
    prisma.$queryRawUnsafe<{ name: string; count: number }[]>(
      `SELECT "activeIngredient" AS name, COUNT(*)::int AS count
       FROM medicines ${commonWhere}
       GROUP BY "activeIngredient"
       ORDER BY count DESC
       LIMIT ${SEARCH.DASHBOARD_TOP_K}`,
      ...params
    ),
  ])

  const total = totalResult[0]?.total ?? 0
  const ativos = ativosResult

  return { total, ativos, inativos: total - ativos, topTrade, topIngredient }
}
