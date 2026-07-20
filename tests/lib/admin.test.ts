import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      findFirst: vi.fn(),
    },
    price: { findMany: vi.fn() },
    syncLog: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('syncWithAnvisa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const { syncWithAnvisa } = await import('@/lib/actions/admin')
    const result = await syncWithAnvisa()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Não autorizado')
  })
})

describe('getImportInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const { getImportInfo } = await import('@/lib/actions/admin')
    const result = await getImportInfo()

    expect(result).toBeNull()
  })

  it('returns import info when logged in', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1', email: 'test@test.com' } })
    vi.mocked(prisma.medicine.count).mockResolvedValue(1000)
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue({
      lastImportAt: new Date('2024-01-01'),
      anvisaFileDate: new Date('2024-01-01'),
    } as never)

    const { getImportInfo } = await import('@/lib/actions/admin')
    const result = await getImportInfo()

    expect(result).not.toBeNull()
    expect(result?.total).toBe(1000)
  })
})

describe('getSyncLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sync logs', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1', email: 'test@test.com' } })
    vi.mocked(prisma.syncLog.findMany).mockResolvedValue([
      { id: 1, type: 'medicines', count: 100, status: 'success' },
    ] as never)

    const { getSyncLogs } = await import('@/lib/actions/admin')
    const result = await getSyncLogs()

    expect(result).toHaveLength(1)
  })
})
