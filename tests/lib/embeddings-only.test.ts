import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuth, MOCK_SESSION } from './http-mock'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
    },
    syncLog: { create: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn() }))

vi.mock('@/lib/embeddings-generator', () => ({
  generateEmbeddings: vi.fn().mockResolvedValue({ count: 100, binSizeBytes: 52428800 }),
}))

vi.mock('@/lib/actions/semantic-search', () => ({
  clearEmbeddingsCache: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('embeddings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized when not logged in', async () => {
    mockAuth(auth).mockResolvedValue(null)
    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    const result = await regenerateEmbeddings()
    expect(result.success).toBe(false)
  })

  it('returns error when no medicines', async () => {
    mockAuth(auth).mockResolvedValue(MOCK_SESSION)
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    const result = await regenerateEmbeddings()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Nenhum medicamento')
  })

  it('generates embeddings successfully', async () => {
    mockAuth(auth).mockResolvedValue(MOCK_SESSION)
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ id: 1 }] as never)
    vi.mocked(prisma.syncLog.create).mockResolvedValue({} as never)
    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    const result = await regenerateEmbeddings()
    expect(result.success).toBe(true)
    expect(result.count).toBe(100)
  })

  it('handles errors during generation', async () => {
    mockAuth(auth).mockResolvedValue(MOCK_SESSION)
    vi.mocked(prisma.medicine.findMany).mockRejectedValue(new Error('DB error'))
    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    const result = await regenerateEmbeddings()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Erro')
  })
})
