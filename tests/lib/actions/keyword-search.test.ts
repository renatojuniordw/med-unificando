import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { keywordSearch } from '@/lib/actions/keyword-search'

describe('keywordSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array for empty query', async () => {
    const result = await keywordSearch('')
    expect(result).toEqual([])
  })

  it('calls $queryRawUnsafe with similarity conditions', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 1, keyword_score: 0.8 },
      { id: 2, keyword_score: 0.5 },
    ])

    const result = await keywordSearch('xarope', 10)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledOnce()
    expect(result).toHaveLength(2)
    expect(result[0].medicineId).toBe(1)
    expect(result[0].keywordScore).toBe(0.8)
  })

  it('includes topK in SQL query', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])

    await keywordSearch('teste', 3)
    const sql = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0][0] as string
    expect(sql).toContain('LIMIT 3')
  })
})
