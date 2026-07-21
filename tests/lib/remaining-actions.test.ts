import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MockAgent, mockAuth, mockHttpsGet, createMockHttpsResponse, MOCK_SESSION } from './http-mock'

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
    price: { count: vi.fn(), findMany: vi.fn() },
    syncLog: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn() }))

vi.mock('xlsx', () => ({
  read: vi.fn(),
  write: vi.fn(),
  utils: { sheet_to_json: vi.fn(), json_to_sheet: vi.fn(), book_new: vi.fn(), book_append_sheet: vi.fn() },
}))

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(vi.fn()),
  env: { cacheDir: '' },
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('semanticSearch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('clearEmbeddingsCache runs without error', async () => {
    const { clearEmbeddingsCache } = await import('@/lib/actions/semantic-search')
    await expect(clearEmbeddingsCache()).resolves.toBeUndefined()
  })
})

describe('references - searchReferenceMedicines', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns results', async () => {
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([
      { referenceMedicine: 'Ref1', _count: { referenceMedicine: 1 } },
    ] as never)
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, tradeName: 'Med1', referenceMedicine: 'Ref1' },
    ] as never)
    const { searchReferenceMedicines } = await import('@/lib/actions/references')
    const result = await searchReferenceMedicines('Ref')
    expect(result).toHaveLength(1)
  })
})

describe('atc - getMedicinesByAtc', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns medicines', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, atcCode: 'A01', tradeName: 'Med' },
    ] as never)
    const { getMedicinesByAtc } = await import('@/lib/actions/atc')
    const result = await getMedicinesByAtc('A01')
    expect(result).toHaveLength(1)
  })
})

describe('admin - getImportInfo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns info', async () => {
    mockAuth(auth).mockResolvedValue(MOCK_SESSION)
    vi.mocked(prisma.medicine.count).mockResolvedValue(500)
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue({
      lastImportAt: new Date(),
      anvisaFileDate: new Date(),
    } as never)
    const { getImportInfo } = await import('@/lib/actions/admin')
    const result = await getImportInfo()
    expect(result?.total).toBe(500)
  })
})

describe('search - getDistinctValues with valid field', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns filtered values', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { status: 'Ativo' },
      { status: 'Inativo' },
    ] as never)
    const { getDistinctValues } = await import('@/lib/actions/search')
    const result = await getDistinctValues('status')
    expect(result.length).toBe(2)
  })
})

describe('admin - syncWithAnvisa up to date', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns skipped when up to date', async () => {
    mockAuth(auth).mockResolvedValue(MOCK_SESSION)
    const now = new Date()
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue({ anvisaFileDate: now } as never)
    vi.mocked(prisma.medicine.count).mockResolvedValue(999)
    const https = await import('https')
    mockHttpsGet(https.default.get).mockImplementation((url, options, cb) => {
      const callback = typeof options === 'function' ? options : cb!
      callback(createMockHttpsResponse({ headers: { 'last-modified': now.toUTCString() } }))
      return { on: vi.fn() }
    })
    const { syncWithAnvisa } = await import('@/lib/actions/admin')
    const result = await syncWithAnvisa()
    expect(result.skipped).toBe(true)
    expect(result.count).toBe(999)
  })
})

describe('medicines-admin - getMedicineForEdit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns medicine', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue({
      id: 1, reference: '123', tradeName: 'Med',
      activeIngredient: 'Sub', similarHolder: 'Co',
      pharmaceuticalForm: 'Comp', concentration: '10mg',
      category: 'Sim', status: 'Ativo',
    } as never)
    const { getMedicineForEdit } = await import('@/lib/actions/medicines-admin')
    const result = await getMedicineForEdit(1)
    expect(result).not.toBeNull()
  })
})
