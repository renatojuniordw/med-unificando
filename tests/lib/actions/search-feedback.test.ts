import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    searchFeedback: {
      create: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }),
}))

import { prisma } from '@/lib/prisma'
import {
  submitSearchFeedback,
  getFeedbackStats,
  getFeedbackByQuery,
  getLowQualityQueries,
} from '@/lib/actions/search-feedback'

describe('submitSearchFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects when query is missing', async () => {
    const result = await submitSearchFeedback({ medicineId: 1, medicineName: 'X', feedback: 'helpful' })
    expect(result).toEqual({ success: false, error: 'Query inválida' })
  })

  it('rejects when query is too long', async () => {
    const result = await submitSearchFeedback({ query: 'a'.repeat(201), medicineId: 1, medicineName: 'X', feedback: 'helpful' })
    expect(result).toEqual({ success: false, error: 'Query inválida' })
  })

  it('rejects when medicineId is not a positive integer', async () => {
    const result = await submitSearchFeedback({ query: 'dor', medicineId: 0, medicineName: 'X', feedback: 'helpful' })
    expect(result).toEqual({ success: false, error: 'Medicamento inválido' })
  })

  it('rejects when feedback is not in the known set', async () => {
    const result = await submitSearchFeedback({ query: 'dor', medicineId: 1, medicineName: 'X', feedback: 'qualquer coisa' })
    expect(result.success).toBe(false)
  })

  it('creates feedback with normalized query on success', async () => {
    vi.mocked(prisma.searchFeedback.create).mockResolvedValue({ id: 1 } as never)
    const result = await submitSearchFeedback({ query: '  Dor Forte  ', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' })
    expect(result.success).toBe(true)
    expect(prisma.searchFeedback.create).toHaveBeenCalledWith({
      data: {
        query: expect.any(String),
        medicineId: 1,
        medicineName: 'Ibuprofeno',
        feedback: 'helpful',
      },
    })
  })
})

describe('getFeedbackStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates stats and top queries/medicines via groupBy', async () => {
    vi.mocked(prisma.searchFeedback.groupBy)
      .mockResolvedValueOnce([
        { query: 'dor', feedback: 'helpful', _count: { _all: 3 } },
        { query: 'dor', feedback: 'not_helpful', _count: { _all: 1 } },
        { query: 'febre', feedback: 'helpful', _count: { _all: 2 } },
      ] as never)
      .mockResolvedValueOnce([
        { medicineName: 'Ibuprofeno', feedback: 'helpful', _count: { _all: 4 } },
      ] as never)

    const stats = await getFeedbackStats()

    expect(stats.total).toBe(6)
    expect(stats.helpful).toBe(5)
    expect(stats.notHelpful).toBe(1)
    expect(stats.accuracy).toBe(83)
    expect(stats.topQueries[0]).toEqual({ query: 'dor', count: 4, helpful: 3, notHelpful: 1 })
    expect(stats.topMedicines[0]).toEqual({ medicineName: 'Ibuprofeno', count: 4, helpful: 4, notHelpful: 0 })
  })

  it('caps top queries at 20', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      query: `q${i}`,
      feedback: 'helpful',
      _count: { _all: 1 },
    }))
    vi.mocked(prisma.searchFeedback.groupBy)
      .mockResolvedValueOnce(rows as never)
      .mockResolvedValueOnce([] as never)

    const stats = await getFeedbackStats()
    expect(stats.topQueries).toHaveLength(20)
  })
})

describe('getFeedbackByQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('groups feedback by medicine name for a query', async () => {
    vi.mocked(prisma.searchFeedback.findMany).mockResolvedValue([
      { medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { medicineName: 'Dipirona', feedback: 'not_helpful' },
    ] as never)

    const result = await getFeedbackByQuery('dor')
    expect(result).toEqual([
      { medicineName: 'Ibuprofeno', total: 2, helpful: 2, notHelpful: 0 },
      { medicineName: 'Dipirona', total: 1, helpful: 0, notHelpful: 1 },
    ])
  })
})

describe('getLowQualityQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns only queries with <50% accuracy and >=3 feedbacks', async () => {
    vi.mocked(prisma.searchFeedback.groupBy).mockResolvedValueOnce([
      { query: 'ruim', feedback: 'helpful', _count: { _all: 1 } },
      { query: 'ruim', feedback: 'not_helpful', _count: { _all: 4 } },
      { query: 'bom', feedback: 'helpful', _count: { _all: 2 } },
      { query: 'bom', feedback: 'not_helpful', _count: { _all: 0 } },
      { query: 'pouco', feedback: 'helpful', _count: { _all: 1 } },
      { query: 'pouco', feedback: 'not_helpful', _count: { _all: 1 } },
    ] as never)

    const result = await getLowQualityQueries()

    expect(result).toHaveLength(1)
    expect(result[0].query).toBe('ruim')
    expect(result[0].total).toBe(5)
    expect(result[0].accuracy).toBe(20)
  })
})