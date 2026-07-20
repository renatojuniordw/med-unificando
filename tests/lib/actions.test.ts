import { describe, it, expect, vi, beforeEach } from 'vitest'

class MockAgent {
  options: any
  constructor(options: any) { this.options = options }
}

vi.mock('https', () => ({
  default: {
    Agent: MockAgent,
    get: vi.fn(),
  },
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
    },
    price: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    syncLog: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('xlsx', () => ({
  read: vi.fn().mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } }),
  utils: {
    sheet_to_json: vi.fn().mockReturnValue([]),
    json_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
}))

import { auth } from '@/auth'

describe('admin actions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('syncWithAnvisa returns unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { syncWithAnvisa } = await import('@/lib/actions/admin')
    expect((await syncWithAnvisa()).success).toBe(false)
  })

  it('importPdf returns unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { importPdf } = await import('@/lib/actions/admin')
    const formData = new FormData()
    const result = await importPdf(formData)
    expect(result.error).toContain('Não autorizado')
  })

  it('getImportInfo returns null when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { getImportInfo } = await import('@/lib/actions/admin')
    expect(await getImportInfo()).toBeNull()
  })
})

describe('prices', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('syncPrices returns unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { syncPrices } = await import('@/lib/actions/prices')
    expect((await syncPrices()).success).toBe(false)
  })
})

describe('medicines-admin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('searchMedicinesForAdmin prisma query', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    const { searchMedicinesForAdmin } = await import('@/lib/actions/medicines-admin')
    const result = await searchMedicinesForAdmin('test')
    expect(result).toEqual([])
  })

  it('updateMedicine returns error when not authorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { updateMedicine } = await import('@/lib/actions/medicines-admin')
    const result = await updateMedicine(1, { tradeName: 'New' })
    expect(result.success).toBe(false)
  })
})

describe('atc', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('getAtcLevels queries prisma', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([])
    const { getAtcLevels } = await import('@/lib/actions/atc')
    const result = await getAtcLevels()
    expect(result.level1).toEqual([])
    expect(result.level2).toEqual([])
    expect(result.level3).toEqual([])
  })
})

describe('compare', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('getMedicinesByIds queries prisma', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    const { getMedicinesByIds } = await import('@/lib/actions/compare')
    expect(await getMedicinesByIds([1])).toEqual([])
  })
})

describe('embeddings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('regenerateEmbeddings returns unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    const result = await regenerateEmbeddings()
    expect(result.success).toBe(false)
  })
})

describe('references', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('getReferenceMedicines queries prisma', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([])
    const { getReferenceMedicines } = await import('@/lib/actions/references')
    expect(await getReferenceMedicines()).toEqual([])
  })

  it('getSimilaresByReference queries prisma', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    const { getSimilaresByReference } = await import('@/lib/actions/references')
    expect(await getSimilaresByReference('Ref')).toEqual([])
  })
})
