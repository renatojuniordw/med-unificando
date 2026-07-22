'use server'

import { prisma } from "@/lib/prisma"
import { buildWhere } from "@/lib/build-where"
import { YEARS } from "@/lib/constants"
import { normalizeMedicine } from "@/lib/format"
import type { Medicine } from "@/generated/prisma/client"
import * as Prisma from "@/generated/prisma/internal/prismaNamespace"
import type { SearchFilters, SearchResponse, DistinctValue, DashboardStats } from "@/types"

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

  return { data: data.map(normalizeMedicine) as Medicine[], total, page, pageSize }
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
  if (status) where.status = { contains: status, mode: 'insensitive' }

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

  return { data: data.map(normalizeMedicine) as Medicine[], total, page, pageSize }
}

export async function getDistinctValues(field: string): Promise<DistinctValue[]> {
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

async function computeTimeline() {
  const allInclusionDates = await prisma.medicine.findMany({ select: { inclusionDate: true } })
  const yearCounts: Record<string, number> = {}
  for (const { inclusionDate } of allInclusionDates) {
    if (inclusionDate && inclusionDate.length >= 4) {
      const year = inclusionDate.substring(6, 10)
      if (year >= YEARS.MIN && year <= YEARS.MAX) {
        yearCounts[year] = (yearCounts[year] || 0) + 1
      }
    }
  }
  return Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year))
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
  const topK = 10

  const [totalMedicines, totalTradeNames, topReferences, topActiveIngredients, groupByStatus, groupByCategory] = await Promise.all([
    prisma.medicine.count(),
    prisma.medicine.groupBy({
      by: ['tradeName'],
      _count: { tradeName: true },
    }).then(r => r.length),
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
      take: 10,
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

function applyFilters(params: { year?: string; category?: string; status?: string }) {
  const where: Record<string, unknown> = {}
  if (params.category) where.category = params.category
  if (params.status) where.status = params.status
  return where
}

export async function getFilteredStats(filters: { year?: string; category?: string; status?: string }): Promise<FilteredStats> {
  const where = applyFilters(filters)

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
