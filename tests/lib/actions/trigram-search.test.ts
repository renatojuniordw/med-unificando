import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { trigramSearch } from '@/lib/actions/trigram-search'

describe('trigramSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty results for empty query', async () => {
    const result = await trigramSearch('')
    expect(result).toEqual([])
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled()
  })

  it('maps raw rows to medicineId + trigramScore', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 10, trigram_score: 0.95 },
      { id: 20, trigram_score: 0.8 },
    ] as never)

    const result = await trigramSearch('dipirona')
    expect(result).toEqual([
      { medicineId: 10, trigramScore: 0.95 },
      { medicineId: 20, trigramScore: 0.8 },
    ])
  })

  it('returns empty array when the query fails (degradation, not throw)', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('pg_trgm não ativa'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await trigramSearch('dipirona')
    expect(result).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})