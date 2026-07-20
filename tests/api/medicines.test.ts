import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    price: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('@/lib/constants', () => ({
  MEDICINE_LIMITS: { MAX_PAGE_SIZE: 100 },
}))

import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

function createRequest(url: string) {
  return new NextRequest(url)
}

describe('GET /api/medicines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated JSON by default', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ id: 1, reference: '123' }] as never)
    vi.mocked(prisma.medicine.count).mockResolvedValue(1)

    const { GET } = await import('@/app/api/medicines/route')
    const req = createRequest('http://localhost/api/medicines?page=1&pageSize=10')
    const res = await GET(req)
    const json = await res.json()

    expect(json.data).toHaveLength(1)
    expect(json.pagination.page).toBe(1)
    expect(json.pagination.pageSize).toBe(10)
  })

  it('returns CSV when format=csv', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { reference: '123', activeIngredient: 'Test', tradeName: 'Med' },
    ] as never)

    const { GET } = await import('@/app/api/medicines/route')
    const req = createRequest('http://localhost/api/medicines?format=csv')
    const res = await GET(req)

    expect(res.headers.get('Content-Type')).toContain('text/csv')
  })

  it('limits pageSize to MAX_PAGE_SIZE', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)

    const { GET } = await import('@/app/api/medicines/route')
    const req = createRequest('http://localhost/api/medicines?pageSize=500')
    const res = await GET(req)
    const json = await res.json()

    expect(json.pagination.pageSize).toBe(100)
  })
})

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns healthy status when db is connected', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }])
    vi.mocked(prisma.medicine.count).mockResolvedValue(100)
    vi.mocked(prisma.price.count).mockResolvedValue(50)

    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    const json = await res.json()

    expect(json.status).toBe('healthy')
    expect(json.database).toBe('connected')
  })
})
