import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { medicine: { findMany: vi.fn() } },
}))

vi.mock('@/lib/actions/medicine-detail', () => ({
  getMedicineDetail: vi.fn(),
}))

vi.mock('@/lib/actions/atc', () => ({
  getMedicinesByAtc: vi.fn(),
  getAtcLevels: vi.fn(),
}))

vi.mock('@/lib/actions/search', () => ({
  getHolderMedicines: vi.fn(),
  getHolderSummary: vi.fn(),
  getDashboardStats: vi.fn(),
  getFilteredStats: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getMedicineDetail } from '@/lib/actions/medicine-detail'
import { getMedicinesByAtc, getAtcLevels } from '@/lib/actions/atc'
import { getHolderMedicines, getHolderSummary, getDashboardStats, getFilteredStats } from '@/lib/actions/search'
import {
  getCachedMedicineDetail,
  getCachedAtcMedicines,
  getCachedHolderMedicines,
  getCachedHolderSummary,
  getCachedReferenceMedicines,
  getCachedSitemapData,
  getCachedDashboardStats,
  getCachedAtcLevels,
  getCachedFilteredStats,
} from '@/lib/data-cache'

describe('data-cache wrappers (unstable_cache pass-through)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCachedMedicineDetail forwards the id to getMedicineDetail', async () => {
    vi.mocked(getMedicineDetail).mockResolvedValue({ id: 7 } as never)
    const result = await getCachedMedicineDetail(7)
    expect(getMedicineDetail).toHaveBeenCalledWith(7)
    expect(result).toEqual({ id: 7 })
  })

  it('getCachedAtcMedicines forwards code/page/pageSize', async () => {
    vi.mocked(getMedicinesByAtc).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 } as never)
    const result = await getCachedAtcMedicines('N02', 2, 10)
    expect(getMedicinesByAtc).toHaveBeenCalledWith('N02', 2, 10)
    expect(result).toMatchObject({ page: 1, pageSize: 20 })
  })

  it('getCachedHolderMedicines forwards all five arguments', async () => {
    vi.mocked(getHolderMedicines).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 5 } as never)
    await getCachedHolderMedicines('H', 1, 5, 'busca', 'Ativo')
    expect(getHolderMedicines).toHaveBeenCalledWith('H', 1, 5, 'busca', 'Ativo')
  })

  it('getCachedHolderSummary forwards the holder', async () => {
    vi.mocked(getHolderSummary).mockResolvedValue({
      holderName: 'X',
      total: 1,
      ativos: 1,
      categoriasCount: 1,
    } as never)
    const result = await getCachedHolderSummary('X')
    expect(getHolderSummary).toHaveBeenCalledWith('X')
    expect(result.holderName).toBe('X')
  })

  it('getCachedReferenceMedicines queries by referenceMedicine insensitive and sorts by name', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ tradeName: 'A' }] as never)
    const result = await getCachedReferenceMedicines('ref')
    expect(prisma.medicine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { referenceMedicine: { equals: 'ref', mode: 'insensitive' } },
        orderBy: { tradeName: 'asc' },
      })
    )
    expect(result).toEqual([{ tradeName: 'A' }])
  })

  it('getCachedDashboardStats delegates to getDashboardStats', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ totalMedicines: 1 } as never)
    await getCachedDashboardStats()
    expect(getDashboardStats).toHaveBeenCalledTimes(1)
  })

  it('getCachedAtcLevels delegates to getAtcLevels', async () => {
    vi.mocked(getAtcLevels).mockResolvedValue({ level1: [], level2: [], level3: [] } as never)
    await getCachedAtcLevels()
    expect(getAtcLevels).toHaveBeenCalledTimes(1)
  })

  it('getCachedFilteredStats delegates to getFilteredStats (import dinâmico)', async () => {
    vi.mocked(getFilteredStats).mockResolvedValue({ totalMedicines: 2 } as never)
    await getCachedFilteredStats({ year: '2026', category: 'Genérico', status: 'Ativo' } as never)
    expect(getFilteredStats).toHaveBeenCalledWith(expect.objectContaining({ year: '2026' }))
  })

  it('getCachedSitemapData aggregates the four findMany queries', async () => {
    vi.mocked(prisma.medicine.findMany)
      .mockResolvedValueOnce([{ id: 1 }] as never)
      .mockResolvedValueOnce([{ referenceMedicine: 'R' }] as never)
      .mockResolvedValueOnce([{ atcCode: 'N02' }] as never)
      .mockResolvedValueOnce([{ similarHolder: 'H' }] as never)

    const result = await getCachedSitemapData()
    expect(prisma.medicine.findMany).toHaveBeenCalledTimes(4)
    expect(result.medicines).toEqual([{ id: 1 }])
    expect(result.references).toEqual([{ referenceMedicine: 'R' }])
    expect(result.atcCodes).toEqual([{ atcCode: 'N02' }])
    expect(result.holders).toEqual([{ similarHolder: 'H' }])
  })
})