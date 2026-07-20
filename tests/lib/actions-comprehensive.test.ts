import { describe, it, expect, vi, beforeEach } from 'vitest'

class MockAgent {
  options: any
  constructor(options: any) { this.options = options }
}

vi.mock('https', () => {
  const get = vi.fn()
  return {
    default: { Agent: MockAgent, get },
    Agent: MockAgent,
    get,
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
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
  read: vi.fn().mockReturnValue({
    SheetNames: ['Sheet1'],
    Sheets: { Sheet1: {} },
  }),
  write: vi.fn().mockReturnValue(Buffer.from([0])),
  utils: {
    sheet_to_json: vi.fn().mockReturnValue([]),
    json_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
}))

vi.mock('@/lib/pdf-parser', () => ({
  parseMedicinePDF: vi.fn().mockResolvedValue([{ reference: '12345' }]),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function makeMockHttps(getFn: any) {
  const https = vi.importActual('https') as any
  return getFn
}

describe('admin.ts internal functions', async () => {
  beforeEach(() => vi.clearAllMocks())

  it('validateRow rejects empty reference', async () => {
    const xlsx = await import('xlsx')
    vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue([{ 'NU_REGISTRO_PRODUTO': '', 'DS_TIPO_CATEGORIA_REGULATORIA': 'Similar' }])
    const https = await import('https')
    vi.mocked(https.default.get).mockImplementation((url: string, options: any, cb: any) => {
      const callback = typeof options === 'function' ? options : cb
      const res: any = { headers: {}, resume: vi.fn() }
      res.on = vi.fn().mockImplementation((e: string, h: Function) => {
        if (e === 'data') h(Buffer.from(''))
        if (e === 'end') h()
        return res
      })
      callback(res)
      return { on: vi.fn() }
    })
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue({ anvisaFileDate: new Date('2020-01-01') } as never)
    vi.mocked(prisma.medicine.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.medicine.createMany).mockResolvedValue({ count: 0 })

    const { syncWithAnvisa } = await import('@/lib/actions/admin')
    const result = await syncWithAnvisa()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Nenhum medicamento')
  })
})

describe('admin - importPdf', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-PDF file', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    const { importPdf } = await import('@/lib/actions/admin')
    const fd = new FormData()
    fd.set('file', new File(['test'], 'test.txt', { type: 'text/plain' }))
    const result = await importPdf(fd)
    expect(result.success).toBe(false)
    expect(result.error).toContain('.pdf')
  })

  it('rejects when no file', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    const { importPdf } = await import('@/lib/actions/admin')
    const result = await importPdf(new FormData())
    expect(result.success).toBe(false)
    expect(result.error).toContain('Nenhum arquivo')
  })

  it('imports PDF successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.medicine.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.medicine.create).mockResolvedValue({} as never)
    const { importPdf } = await import('@/lib/actions/admin')
    const fd = new FormData()
    fd.set('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }))
    const result = await importPdf(fd)
    expect(result.success).toBe(true)
  })
})

describe('admin - getSyncLogs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns logs when logged in', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.syncLog.findMany).mockResolvedValue([{ id: 1 }] as never)
    const { getSyncLogs } = await import('@/lib/actions/admin')
    expect(await getSyncLogs()).toHaveLength(1)
  })
})

describe('admin - getImportInfo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { getImportInfo } = await import('@/lib/actions/admin')
    expect(await getImportInfo()).toBeNull()
  })
})

describe('prices - getPriceStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns stats', async () => {
    vi.mocked(prisma.price.count).mockResolvedValueOnce(100).mockResolvedValueOnce(80)
    const { getPriceStats } = await import('@/lib/actions/prices')
    const result = await getPriceStats()
    expect(result.total).toBe(100)
    expect(result.withPrice).toBe(80)
  })
})

describe('prices - syncPrices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { syncPrices } = await import('@/lib/actions/prices')
    expect((await syncPrices()).success).toBe(false)
  })

  it('syncs prices', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.price.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.price.createMany).mockResolvedValue({ count: 1 })
    const https = await import('https')
    vi.mocked(https.default.get).mockImplementation((url: any, options: any, cb: any) => {
      const callback = typeof options === 'function' ? options : cb
      const res: any = { headers: {}, resume: vi.fn() }
      res.on = vi.fn().mockImplementation((e: string, h: Function) => {
        if (e === 'data') h(Buffer.from('header\nNU_REGISTRO;company\n12345;Test'))
        if (e === 'end') h()
        return res
      })
      callback(res)
      return { on: vi.fn() }
    })
    const { syncPrices } = await import('@/lib/actions/prices')
    const result = await syncPrices()
    expect(result.success).toBe(true)
  })
})

describe('search - searchMedicines', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns results with pagination', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ id: 1 }] as never)
    vi.mocked(prisma.medicine.count).mockResolvedValue(1)
    const { searchMedicines } = await import('@/lib/actions/search')
    const result = await searchMedicines(1, 10, {})
    expect(result.data).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})

describe('search - getDashboardStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns dashboard stats', async () => {
    vi.mocked(prisma.medicine.count).mockResolvedValue(100)
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([])
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    vi.mocked(prisma.price.count).mockResolvedValue(50)
    const { getDashboardStats } = await import('@/lib/actions/search')
    const result = await getDashboardStats()
    expect(result).toHaveProperty('totalMedicines')
  })
})

describe('search - getDistinctValues', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty for unknown field', async () => {
    const { getDistinctValues } = await import('@/lib/actions/search')
    expect(await getDistinctValues('unknown')).toEqual([])
  })
})

describe('search - getFilteredStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns filtered stats', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { inclusionDate: '2024-01', status: 'Ativo', activeIngredient: 'A', tradeName: 'T' },
    ] as never)
    const { getFilteredStats } = await import('@/lib/actions/search')
    const result = await getFilteredStats({})
    expect(result.ativos).toBe(1)
  })
})

describe('medicines-admin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('searches', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ id: 1, reference: '123' }] as never)
    const { searchMedicinesForAdmin } = await import('@/lib/actions/medicines-admin')
    expect(await searchMedicinesForAdmin('123')).toHaveLength(1)
  })
})

describe('atc', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAtcLevels', async () => {
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([
      { atcCode: 'A', _count: { atcCode: 1 } },
    ] as never)
    const { getAtcLevels } = await import('@/lib/actions/atc')
    const result = await getAtcLevels()
    expect(result.level1).toBeDefined()
  })

  it('getMedicinesByAtc', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ id: 1 }] as never)
    const { getMedicinesByAtc } = await import('@/lib/actions/atc')
    expect(await getMedicinesByAtc('A')).toHaveLength(1)
  })
})

describe('compare', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getMedicinesByIds', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ id: 1 }] as never)
    const { getMedicinesByIds } = await import('@/lib/actions/compare')
    expect(await getMedicinesByIds([1])).toHaveLength(1)
  })
})

describe('references', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getReferenceMedicines', async () => {
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([
      { referenceMedicine: 'Ref', _count: { referenceMedicine: 1 } },
    ] as never)
    const { getReferenceMedicines } = await import('@/lib/actions/references')
    expect(await getReferenceMedicines()).toHaveLength(1)
  })
})

describe('embeddings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
    expect((await regenerateEmbeddings()).success).toBe(false)
  })
})

describe('pdf-report', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when not found', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue(null)
    const { generateMedicinePdf } = await import('@/lib/actions/pdf-report')
    await expect(generateMedicinePdf(999)).rejects.toThrow()
  })

  it('generates PDF when medicine exists', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue({
      id: 1, reference: '123', tradeName: 'Test', activeIngredient: 'Sub',
      similarHolder: 'Holder', pharmaceuticalForm: 'Tablet', concentration: '10mg',
      category: 'Similar', status: 'Ativo',
    } as never)
    vi.mocked(prisma.price.findMany).mockResolvedValue([])
    const { generateMedicinePdf } = await import('@/lib/actions/pdf-report')
    const buffer = await generateMedicinePdf(1)
    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(0)
  })
})

describe('exportToExcel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exports excel', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{
      reference: '123', activeIngredient: 'Sub', tradeName: 'Med', similarHolder: 'Co',
      pharmaceuticalForm: 'Comp', concentration: '10mg', inclusionDate: '2024', category: 'Sim',
      referenceMedicine: 'Ref', atcCode: 'A01', prescriptionType: 'Tarja', status: 'Ativo',
      authorization: 'Aut', presentationCount: 1,
    }] as never)

    const { exportToExcel } = await import('@/lib/actions/export-action')
    const result = await exportToExcel()
    expect(result.filename).toMatch(/medicamentos/)
    expect(result.buffer).toBeDefined()
  })
})

describe('exportToCsv', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exports csv', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{
      reference: '123', activeIngredient: 'Sub', tradeName: 'Med',
      similarHolder: 'Co', pharmaceuticalForm: 'Comp', concentration: '10mg',
      inclusionDate: '2024', category: 'Sim', referenceMedicine: 'Ref',
      atcCode: 'A01', prescriptionType: 'Tarja', status: 'Ativo',
      authorization: 'Aut', presentationCount: 1,
    }] as never)

    const { exportToCsv } = await import('@/lib/actions/export-action')
    const result = await exportToCsv()
    expect(result.text).toContain('Referência')
    expect(result.filename).toMatch(/medicamentos/)
  })
})

describe('searchMedicinesForCompare', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns results', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([{ id: 1, tradeName: 'Test', activeIngredient: 'Sub' }] as never)
    const { searchMedicinesForCompare } = await import('@/lib/actions/compare')
    const result = await searchMedicinesForCompare('Test')
    expect(result).toHaveLength(1)
  })
})

describe('updateMedicine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates medicine', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.medicine.update).mockResolvedValue({} as never)
    const { updateMedicine } = await import('@/lib/actions/medicines-admin')
    const result = await updateMedicine(1, { tradeName: 'New' })
    expect(result.success).toBe(true)
  })
})
