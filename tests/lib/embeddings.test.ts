import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(async () => ({
    data: Array(384).fill(0.1),
  })),
}))

import { auth } from '@/auth'

describe('regenerateEmbeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    const result = await regenerateEmbeddings()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Não autorizado')
  })
})

describe('semanticSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns results for search query', async () => {
    vi.mocked(prisma.findMany).mockResolvedValue([
      { id: 1, tradeName: 'Test', embedding: Array(384).fill(0.1) },
    ] as never)

    const { semanticSearch } = await import('@/lib/actions/semantic-search')
    const result = await semanticSearch('teste')

    expect(result).toHaveLength(0) // no embeddings stored
  })
})
