import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MockAgent, mockAuth, mockHttpsGet, createMockHttpsResponse, FULL_MEDICINE_UPDATE, MOCK_SESSION } from './http-mock'

vi.mock('https', () => ({
  default: { Agent: MockAgent, get: vi.fn() },
  Agent: MockAgent,
  get: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    price: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    syncLog: { create: vi.fn(), findMany: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn() }))


vi.mock('xlsx', () => ({
  read: vi.fn(),
  write: vi.fn(),
  utils: { sheet_to_json: vi.fn(), json_to_sheet: vi.fn(), book_new: vi.fn(), book_append_sheet: vi.fn() },
}))

vi.mock('@/lib/csv-utils', () => ({
  downloadCsv: vi.fn().mockResolvedValue(''),
  parseCsvToRows: vi.fn().mockReturnValue([]),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('atc - getAtcLevels', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns grouped levels from findMany', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { atcCode: 'A' },
      { atcCode: 'A01' },
      { atcCode: 'A01A' },
      { atcCode: 'B' },
    ] as never)
    const { getAtcLevels } = await import('@/lib/actions/atc')
    const result = await getAtcLevels()
    expect(result.level1.length).toBeGreaterThan(0)
    expect(result.level2.length).toBeGreaterThan(0)
    expect(result.level3.length).toBeGreaterThan(0)
  })
})

describe('embeddings - regenerateEmbeddings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized when not logged in', async () => {
    mockAuth(auth).mockResolvedValue(null)
    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    const result = await regenerateEmbeddings()
    expect(result.success).toBe(false)
  })
})

describe('admin - syncWithAnvisa error handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('handles fetch errors gracefully', async () => {
    mockAuth(auth).mockResolvedValue(MOCK_SESSION)
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue(null)
    const https = await import('https')
    mockHttpsGet(https.default.get).mockImplementation((url, options, cb) => {
      const callback = typeof options === 'function' ? options : cb!
      callback(createMockHttpsResponse({ data: 'header' }))
      return { on: vi.fn() }
    })
    const { syncWithAnvisa } = await import('@/lib/actions/admin')
    const result = await syncWithAnvisa()
    expect(result.success).toBe(false)
  })
})

describe('search - getFilteredStats with year filter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filters by year', async () => {
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([{ total: 2 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    const { getFilteredStats } = await import('@/lib/actions/search')
    const result = await getFilteredStats({ year: '2024' })
    expect(result.ativos).toBe(1)
    expect(result.inativos).toBe(1)
  })
})

describe('admin - getSyncLogs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty when not logged in', async () => {
    mockAuth(auth).mockResolvedValue(null)
    const { getSyncLogs } = await import('@/lib/actions/admin')
    expect(await getSyncLogs()).toEqual([])
  })
})

describe('medicines-admin - updateMedicine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not logged in', async () => {
    mockAuth(auth).mockResolvedValue(null)
    const { updateMedicine } = await import('@/lib/actions/medicines-admin')
    const result = await updateMedicine(1, FULL_MEDICINE_UPDATE)
    expect(result.success).toBe(false)
  })
})

describe('prices - syncPrices error', () => {
  beforeEach(() => vi.clearAllMocks())

  it('handles sync error', async () => {
    mockAuth(auth).mockResolvedValue(MOCK_SESSION)
    vi.mocked(prisma.price.deleteMany).mockRejectedValue(new Error('DB error'))
    const https = await import('https')
    mockHttpsGet(https.default.get).mockImplementation((url, options, cb) => {
      const callback = typeof options === 'function' ? options : cb!
      callback(createMockHttpsResponse({ data: 'header' }))
      return { on: vi.fn() }
    })
    const { syncPrices } = await import('@/lib/actions/prices')
    const result = await syncPrices()
    expect(result.success).toBe(false)
  })
})
