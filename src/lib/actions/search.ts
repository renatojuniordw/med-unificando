'use server'

import { prisma } from "@/lib/prisma"
import type { Medicine } from "@/generated/prisma/client"
import * as Prisma from "@/generated/prisma/internal/prismaNamespace"
import type { SearchFilters, SearchResponse, DistinctValue, DashboardStats } from "@/types"

function buildWhere(filters: SearchFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  if (filters.reference) {
    where.reference = { contains: filters.reference, mode: 'insensitive' }
  }
  if (filters.activeIngredient) {
    where.activeIngredient = { contains: filters.activeIngredient, mode: 'insensitive' }
  }
  if (filters.tradeName) {
    where.tradeName = { contains: filters.tradeName, mode: 'insensitive' }
  }
  if (filters.similarHolder) {
    where.similarHolder = { contains: filters.similarHolder, mode: 'insensitive' }
  }
  if (filters.pharmaceuticalForm) {
    where.pharmaceuticalForm = { contains: filters.pharmaceuticalForm, mode: 'insensitive' }
  }
  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' }
  }
  if (filters.status) {
    where.status = { contains: filters.status, mode: 'insensitive' }
  }

  return where
}

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

  return { data: data as Medicine[], total, page, pageSize }
}

export async function getDistinctValues(field: string): Promise<DistinctValue[]> {
  const validFields: Record<string, Prisma.MedicineScalarFieldEnum> = {
    reference: Prisma.MedicineScalarFieldEnum.reference,
    activeIngredient: Prisma.MedicineScalarFieldEnum.activeIngredient,
    tradeName: Prisma.MedicineScalarFieldEnum.tradeName,
    similarHolder: Prisma.MedicineScalarFieldEnum.similarHolder,
    pharmaceuticalForm: Prisma.MedicineScalarFieldEnum.pharmaceuticalForm,
    category: Prisma.MedicineScalarFieldEnum.category,
    status: Prisma.MedicineScalarFieldEnum.status,
  }

  const fieldEnum = validFields[field]
  if (!fieldEnum) return []

  const result = await prisma.medicine.findMany({
    select: { [field]: true },
    distinct: [fieldEnum],
    orderBy: { [field]: 'asc' },
  })

  return result
    .map((item) => ({ value: (item as Record<string, string>)[field] }))
    .filter((item) => item.value)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const allInclusionDates = await prisma.medicine.findMany({ select: { inclusionDate: true } })
  const yearCounts: Record<string, number> = {}
  for (const { inclusionDate } of allInclusionDates) {
    if (inclusionDate && inclusionDate.length >= 4) {
      const year = inclusionDate.substring(6, 10)
      if (year >= '2000' && year <= '2030') {
        yearCounts[year] = (yearCounts[year] || 0) + 1
      }
    }
  }
  const timeline = Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year))

  const [totalMedicines, totalTradeNames, topTradeNames, topActiveIngredients, groupByStatus, groupByCategory] = await Promise.all([
    prisma.medicine.count(),
    prisma.medicine.groupBy({
      by: ['tradeName'],
      _count: { tradeName: true },
    }).then(r => r.length),
    prisma.medicine.groupBy({
      by: ['tradeName'],
      _count: { tradeName: true },
      orderBy: { _count: { tradeName: 'desc' } },
      take: 10,
    }).then(r => r.map(item => ({ name: item.tradeName, count: item._count.tradeName }))),
    prisma.medicine.groupBy({
      by: ['activeIngredient'],
      _count: { activeIngredient: true },
      orderBy: { _count: { activeIngredient: 'desc' } },
      take: 10,
    }).then(r => r.map(item => ({ name: item.activeIngredient, count: item._count.activeIngredient }))),
    prisma.medicine.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.medicine.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    }).then(r => r.map(item => ({ name: item.category ?? 'Sem categoria', count: item._count.category }))),
  ])

  const ativoCount = groupByStatus.find(s => s.status?.toLowerCase() === 'ativo' || s.status === '')?._count.status ?? 0
  const inativoCount = groupByStatus.find(s => s.status?.toLowerCase() === 'inativo')?._count.status ?? 0

  return {
    totalMedicines,
    totalReferences: totalTradeNames,
    topReferences: topTradeNames,
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
  const where: Record<string, unknown> = {}
  if (filters.category) where.category = filters.category
  if (filters.status) where.status = filters.status

  const raw = await prisma.medicine.findMany({
    where,
    select: { inclusionDate: true, tradeName: true, activeIngredient: true, status: true },
  })

  let filtered = raw
  if (filters.year) {
    filtered = raw.filter(m => m.inclusionDate?.endsWith(filters.year!))
  }

  const total = filtered.length
  const ativos = filtered.filter(m => m.status === 'Ativo').length

  const tradeCount: Record<string, number> = {}
  const ingredientCount: Record<string, number> = {}
  for (const m of filtered) {
    tradeCount[m.tradeName] = (tradeCount[m.tradeName] || 0) + 1
    ingredientCount[m.activeIngredient] = (ingredientCount[m.activeIngredient] || 0) + 1
  }

  const topTrade = Object.entries(tradeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const topIngredient = Object.entries(ingredientCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return { total, ativos, inativos: total - ativos, topTrade, topIngredient }
}
