import { describe, it, expect, vi } from 'vitest'

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

vi.mock('fs', () => {
  let callCount = 0
  return {
    default: { readFileSync: vi.fn(() => {
      callCount++
      if (callCount === 1) {
        return JSON.stringify({ count: 1, dim: 4, ids: [1] })
      }
      return Buffer.from(new Float32Array([0.1, 0.2, 0.3, 0.4]).buffer)
    })},
    readFileSync: vi.fn(() => {
      callCount++
      if (callCount === 1) {
        return JSON.stringify({ count: 1, dim: 4, ids: [1] })
      }
      return Buffer.from(new Float32Array([0.1, 0.2, 0.3, 0.4]).buffer)
    }),
  }
})

vi.mock('path', () => ({
  default: { join: vi.fn(() => '/fake/path') },
  join: vi.fn(() => '/fake/path'),
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

  it('returns RRF-fused results when both searches return results', async () => {
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
})
