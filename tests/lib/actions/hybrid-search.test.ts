import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: { findMany: vi.fn() },
    $queryRawUnsafe: vi.fn(),
  },
}))

vi.mock('@/lib/actions/keyword-search', () => ({
  keywordSearch: vi.fn(),
}))

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(
    vi.fn().mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3, 0.4]),
    })
  ),
  env: { cacheDir: '' },
}))

import { hybridSearch, clearEmbeddingsCache } from '@/lib/actions/semantic-search'
import { prisma } from '@/lib/prisma'
import { keywordSearch } from '@/lib/actions/keyword-search'

describe('hybridSearch', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await clearEmbeddingsCache()
  })

  it('returns empty array for empty query', async () => {
    const result = await hybridSearch('')
    expect(result).toEqual([])
  })

  it('calls pgvector $queryRawUnsafe for semantic search', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 1, semantic_score: 0.95 },
      { id: 2, semantic_score: 0.85 },
    ])
    vi.mocked(keywordSearch).mockResolvedValue([
      { medicineId: 2, keywordScore: 0.9 },
      { medicineId: 3, keywordScore: 0.7 },
    ])
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, tradeName: 'Remédio A', status: 'Ativo' },
      { id: 2, tradeName: 'Remédio B', status: 'Ativo' },
    ] as any)

    const result = await hybridSearch('teste', 5)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('score')
    expect(result[0]).toHaveProperty('medicine')
  })

  it('uses pgvector cosine distance in SQL', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 1, semantic_score: 0.9 },
    ])
    vi.mocked(keywordSearch).mockResolvedValue([])
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, tradeName: 'Med A', status: 'Ativo' },
    ] as any)

    await hybridSearch('losartana', 10)
    const sql = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0][0] as string
    expect(sql).toContain('embedding <=> $1::vector')
    expect(sql).toContain('semantic_score')
  })
})
