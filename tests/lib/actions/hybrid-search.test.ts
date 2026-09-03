import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => {
  const queryRawUnsafe = vi.fn()
  return {
    prisma: {
      medicine: { findMany: vi.fn() },
      searchFeedback: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRawUnsafe: queryRawUnsafe,
      $transaction: vi.fn((callback: (tx: unknown) => unknown) =>
        callback({
          $executeRawUnsafe: vi.fn(),
          $queryRawUnsafe: queryRawUnsafe,
        })
      ),
    },
  }
})

vi.mock('@/lib/actions/keyword-search', () => ({
  keywordSearch: vi.fn(),
}))

vi.mock('@/lib/actions/trigram-search', () => ({
  trigramSearch: vi.fn().mockResolvedValue([]),
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

  it('returns empty results for empty query', async () => {
    const result = await hybridSearch('')
    expect(result.results).toEqual([])
    expect(result.suggestions).toEqual([])
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
    ] as never)

    const result = await hybridSearch('teste', 5)
    expect(result.results.length).toBeGreaterThan(0)
    expect(result.results[0]).toHaveProperty('score')
    expect(result.results[0]).toHaveProperty('medicine')
  })

  it('uses pgvector cosine distance in SQL', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 1, semantic_score: 0.9 },
    ])
    vi.mocked(keywordSearch).mockResolvedValue([])
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, tradeName: 'Med A', status: 'Ativo' },
    ] as never)

    await hybridSearch('losartana', 10)
    const sql = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0][0] as string
    expect(sql).toContain('<=> $1::vector')
    expect(sql).toContain('semantic_score')
  })

  it('returns empty when semantic fails the gate and there is no lexical evidence', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 1, semantic_score: 0.85 },
      { id: 2, semantic_score: 0.83 },
    ])
    vi.mocked(keywordSearch).mockResolvedValue([])

    const result = await hybridSearch('zzqqxxtermoinexistente', 5)
    expect(result.results).toEqual([])
    expect(result.suggestions).toEqual([])
  })
})
