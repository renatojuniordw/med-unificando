import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    price: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
    syncLog: { create: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

class MockAgent {
  options: any
  constructor(options: any) {
    this.options = options
  }
}

vi.mock('https', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string, options: any, callback: Function) => {
      const res: any = {}
      res.on = vi.fn().mockImplementation((event: string, handler: Function) => {
        if (event === 'data') handler(Buffer.from('header\nNU_REGISTRO;company\n12345;Test'))
        if (event === 'end') handler()
        return res
      })
      callback(res)
      return { on: vi.fn() }
    }),
    Agent: MockAgent,
  },
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('syncPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const { syncPrices } = await import('@/lib/actions/prices')
    const result = await syncPrices()

    expect(result.success).toBe(false)
  })

  it('returns success on successful sync', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1', email: 'test@test.com' } })
    vi.mocked(prisma.price.deleteMany).mockResolvedValue({ count: 100 })
    vi.mocked(prisma.price.createMany).mockResolvedValue({ count: 100 })
    vi.mocked(prisma.syncLog.create).mockResolvedValue({} as never)

    const { syncPrices } = await import('@/lib/actions/prices')
    const result = await syncPrices()

    expect(result.success).toBe(true)
  })
})

describe('getPriceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns price statistics', async () => {
    vi.mocked(prisma.price.count).mockResolvedValue(1000)
    vi.mocked(prisma.price.count).mockResolvedValueOnce(1000)
    vi.mocked(prisma.price.count).mockResolvedValueOnce(800)

    const { getPriceStats } = await import('@/lib/actions/prices')
    const result = await getPriceStats()

    expect(result).toBeDefined()
    expect(result.total).toBe(1000)
    expect(result.withPrice).toBe(800)
  })
})
