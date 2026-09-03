import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRawUnsafe: vi.fn() } }))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const authMock = auth as unknown as () => Promise<{
  user: { email: string; name: string; role: string } | null
} | null>

const adminSession = () => ({ user: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN' } })
const userSession = () => ({ user: { email: 'u@example.com', name: 'User', role: 'USER' } })

describe('GET /api/search-analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(authMock).mockResolvedValue(null)

    const { GET } = await import('@/app/api/search-analytics/route')
    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin users without querying the database', async () => {
    vi.mocked(authMock).mockResolvedValue(userSession())

    const { GET } = await import('@/app/api/search-analytics/route')
    const res = await GET()

    expect(res.status).toBe(403)
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled()
  })

  it('returns aggregated stats for admins with fallbacks for empty aggregates', async () => {
    vi.mocked(authMock).mockResolvedValue(adminSession())
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([{ query: 'dip', count: 3, avg_score: 0.5 }]) // topQueries
      .mockResolvedValueOnce([]) // noResults
      .mockResolvedValueOnce([]) // performance -> fallback
      .mockResolvedValueOnce([]) // totalSearches7d -> fallback 0
      .mockResolvedValueOnce([{ query_type: 'condition', count: 1 }]) // byType

    const { GET } = await import('@/app/api/search-analytics/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.topQueries).toEqual([{ query: 'dip', count: 3, avg_score: 0.5 }])
    expect(body.noResultsQueries).toEqual([])
    expect(body.performance).toEqual({ avg_ms: 0, p95_ms: 0 })
    expect(body.totalSearchesLast7Days).toBe(0)
    expect(body.byType).toEqual([{ query_type: 'condition', count: 1 }])
  })

  it('returns 500 with generic message when the database fails', async () => {
    vi.mocked(authMock).mockResolvedValue(adminSession())
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('db down'))

    const { GET } = await import('@/app/api/search-analytics/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Falha ao buscar estatísticas')
  })
})