import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    medicine: { count: vi.fn() },
    price: { count: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns healthy with database stats when the DB responds', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ column: 1 }])
    vi.mocked(prisma.medicine.count).mockResolvedValue(12)
    vi.mocked(prisma.price.count).mockResolvedValue(34)

    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.database).toBe('connected')
    expect(body.stats).toEqual({ medicines: 12, prices: 34 })
  })

  it('returns 503 unhealthy when the DB is unreachable', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('connection refused'))

    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.status).toBe('unhealthy')
    expect(body.database).toBe('disconnected')
  })
})