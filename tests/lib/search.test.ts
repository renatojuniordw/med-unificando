import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/build-where', () => ({
  buildWhere: vi.fn().mockReturnValue({}),
}))

import { prisma } from '@/lib/prisma'
import { buildWhere } from '@/lib/build-where'

describe('searchMedicines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls prisma with correct pagination', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)

    const { searchMedicines } = await import('@/lib/actions/search')
    await searchMedicines(2, 20, {})

    expect(prisma.medicine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
        orderBy: { reference: 'asc' },
      })
    )
  })

  it('calls prisma with filters', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)
    vi.mocked(buildWhere).mockReturnValue({ category: { contains: 'Similar', mode: 'insensitive' } })

    const { searchMedicines } = await import('@/lib/actions/search')
    await searchMedicines(1, 10, { category: 'Similar' })

    expect(buildWhere).toHaveBeenCalledWith({ category: 'Similar' })
  })

  it('returns correct response structure', async () => {
    const mockData = [{ id: 1, reference: '12345', tradeName: 'Test' }]
    vi.mocked(prisma.medicine.findMany).mockResolvedValue(mockData as never)
    vi.mocked(prisma.medicine.count).mockResolvedValue(50)

    const { searchMedicines } = await import('@/lib/actions/search')
    const result = await searchMedicines(1, 10)

    expect(result).toEqual({
      data: mockData,
      total: 50,
      page: 1,
      pageSize: 10,
    })
  })
})

describe('getFilteredStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns stats with total and ativos count', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { status: 'Ativo', tradeName: 'A', activeIngredient: 'X', inclusionDate: '2024' },
      { status: 'Ativo', tradeName: 'B', activeIngredient: 'Y', inclusionDate: '2024' },
      { status: 'Inativo', tradeName: 'A', activeIngredient: 'Z', inclusionDate: '2023' },
    ] as never)

    const { getFilteredStats } = await import('@/lib/actions/search')
    const result = await getFilteredStats({})

    expect(result.total).toBe(3)
    expect(result.ativos).toBe(2)
    expect(result.inativos).toBe(1)
  })
})
