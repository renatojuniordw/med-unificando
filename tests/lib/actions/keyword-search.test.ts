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

  it('returns empty array when parseQuery returns no terms', async () => {
    const result = await keywordSearch('   ')
    expect(result).toEqual([])
  })

  it('calls $queryRawUnsafe with plainto_tsquery', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 1, keyword_score: 0.8 },
      { id: 2, keyword_score: 0.5 },
    ])

    const result = await keywordSearch('xarope antialérgico', 10)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledOnce()

    const sql = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0][0] as string
    expect(sql).toContain('plainto_tsquery')
    expect(sql).toContain("portuguese")
    expect(sql).toContain('ts_rank')
    expect(sql).toContain('"search_document"')

    expect(result).toHaveLength(2)
    expect(result[0].medicineId).toBe(1)
    expect(result[0].keywordScore).toBe(0.8)
  })

  it('includes LIMIT in SQL', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])
    await keywordSearch('teste', 5)
    const sql = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0][0] as string
    expect(sql).toContain('LIMIT $2')
    const params = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0]
    expect(params[2]).toBe(5)
  })

  it('expands synonyms before querying', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])
    await keywordSearch('pressao alta', 10)
    const params = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0] as unknown[]
    const searchQuery = params[1] as string
    expect(searchQuery).toContain('hipertensao')
    expect(searchQuery).toContain('anti-hipertensivo')
  })

  it('expands pharmaceutical form terms via query-parser', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])
    await keywordSearch('xarope', 10)
    const params = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0] as unknown[]
    const searchQuery = params[1] as string
    expect(searchQuery).toContain('xarope')
  })

  it('returns mapped results correctly', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 42, keyword_score: 0.99 },
    ])
    const result = await keywordSearch('losartana', 5)
    expect(result[0]).toEqual({ medicineId: 42, keywordScore: 0.99 })
  })
})
