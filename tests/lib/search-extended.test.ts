import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    price: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/build-where', () => ({
  buildWhere: vi.fn().mockReturnValue({}),
}))

import { prisma } from '@/lib/prisma'

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns dashboard stats', async () => {
    vi.mocked(prisma.medicine.count).mockResolvedValue(100)
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([
      { tradeName: 'med1', _count: { tradeName: 1 } },
    ] as never)
    vi.mocked(prisma.price.count).mockResolvedValue(50)

    const { getDashboardStats } = await import('@/lib/actions/search')
    const result = await getDashboardStats()

    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('totalAtivos')
    expect(result).toHaveProperty('totalInativos')
    expect(result).toHaveProperty('totalSimilares')
  })

  it('handles empty data', async () => {
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([])
    vi.mocked(prisma.price.count).mockResolvedValue(0)

    const { getDashboardStats } = await import('@/lib/actions/search')
    const result = await getDashboardStats()

    expect(result.total).toBe(0)
  })
})

describe('getDistinctValues', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns distinct values for a field', async () => {
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([
      { category: 'Similar' },
      { category: 'Referência' },
    ] as never)
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { category: 'Similar' },
    ] as never)

    const { getDistinctValues } = await import('@/lib/actions/search')
    const result = await getDistinctValues('category')

    expect(result).toHaveLength(2)
    expect(result[0].value).toBeDefined()
  })
})

describe('getFilteredStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns filtered stats', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { inclusionDate: '2024-01', status: 'Ativo', activeIngredient: 'A', tradeName: 'T1' },
      { inclusionDate: '2024-02', status: 'Ativo', activeIngredient: 'B', tradeName: 'T2' },
    ] as never)

    const { getFilteredStats } = await import('@/lib/actions/search')
    const result = await getFilteredStats({})

    expect(result.ativos).toBe(2)
    expect(result.total).toBe(2)
  })

  it('filters by category', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { inclusionDate: '2024-01', status: 'Ativo', category: 'Similar', activeIngredient: 'A', tradeName: 'T1' },
    ] as never)

    const { getFilteredStats } = await import('@/lib/actions/search')
    const result = await getFilteredStats({ category: 'Similar' })

    expect(result.ativos).toBe(1)
  })
})
