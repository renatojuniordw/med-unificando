import { describe, it, expect, vi, beforeEach } from 'vitest'

class MockAgent {
  options: any
  constructor(options: any) { this.options = options }
}

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
    price: { count: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    syncLog: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn() }))

vi.mock('xlsx', () => ({
  read: vi.fn().mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } }),
  write: vi.fn().mockReturnValue(Buffer.from([1])),
  utils: {
    sheet_to_json: vi.fn().mockReturnValue([{ 'NU_REGISTRO_PRODUTO': '12345', 'DS_TIPO_CATEGORIA_REGULATORIA': 'SIMILAR', 'SUBSTANCIAS_MEDICAMENTOS': 'Sub', 'NO_PRODUTO': 'Med', 'NO_RAZAO_SOCIAL_EMPRESA': 'Co', 'CO_FORMA_FISICA': 'Comp', 'COMPLEMENTO': '10mg', 'DATA_PUBLICACAO': '2024-01-01', 'DS_REFERENCIA': 'Ref', 'CO_ATC': 'A01', 'CO_TARJA': 'Tarja', 'VALIDADE_SITUACAO': 'Ativo', 'AUTORIZACAO_MEDICAMENTO': 'Aut', 'NUMERO_APRESENTACOES': '1', 'SINONIMOS': 'Syn', 'INDICACOES': 'Ind' }]),
    json_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('admin - full sync path', () => {
  beforeEach(() => vi.clearAllMocks())

  it('syncs and creates sync log', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue({ anvisaFileDate: new Date('2020-01-01') } as never)
    vi.mocked(prisma.medicine.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.medicine.createMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.syncLog.create).mockResolvedValue({} as never)

    const https = await import('https')
    vi.mocked(https.default.get).mockImplementation((url: any, options: any, cb: any) => {
      const callback = typeof options === 'function' ? options : cb
      const res: any = { headers: { 'last-modified': new Date('2025-01-01').toUTCString() }, resume: vi.fn() }
      let dataSent = false
      res.on = vi.fn().mockImplementation((e: string, h: Function) => {
        if (e === 'data' && !dataSent) { dataSent = true; h(Buffer.from('')) }
        if (e === 'end') h()
        return res
      })
      callback(res)
      return { on: vi.fn() }
    })

    const { syncWithAnvisa } = await import('@/lib/actions/admin')
    const result = await syncWithAnvisa()
    expect(result.success).toBe(true)
    expect(prisma.syncLog.create).toHaveBeenCalled()
  })
})

describe('search - getFilteredStats with status and category', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filters by status and category', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { inclusionDate: '01/01/2024', status: 'Ativo', category: 'Similar', activeIngredient: 'A', tradeName: 'T1' },
      { inclusionDate: '01/02/2024', status: 'Ativo', category: 'Similar', activeIngredient: 'B', tradeName: 'T2' },
    ] as never)
    const { getFilteredStats } = await import('@/lib/actions/search')
    const result = await getFilteredStats({ status: 'Ativo', category: 'Similar' })
    expect(result.ativos).toBe(2)
  })
})

describe('pdf-report - generate with prices and without', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates PDF with prices', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue({
      id: 1, reference: '123', tradeName: 'Test', activeIngredient: 'Sub',
      similarHolder: 'Co', pharmaceuticalForm: 'Comp', concentration: '10mg',
      category: 'Sim', status: 'Ativo', referenceMedicine: 'Ref', atcCode: 'A01',
      prescriptionType: 'Tarja', presentationCount: 1,
    } as never)
    vi.mocked(prisma.price.findMany).mockResolvedValue([
      { presentation: 'COMP 10MG', pf0Price: 10.5, pf18Price: 12.5 },
    ] as never)
    const { generateMedicinePdf } = await import('@/lib/actions/pdf-report')
    const buffer = await generateMedicinePdf(1)
    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('generates PDF without presentationCount', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue({
      id: 2, reference: '456', tradeName: 'Test2', activeIngredient: 'Sub2',
      similarHolder: 'Co', pharmaceuticalForm: 'Comp', concentration: '20mg',
      category: 'Gen', status: 'Inativo', referenceMedicine: null, atcCode: null,
      prescriptionType: null, presentationCount: null,
    } as never)
    vi.mocked(prisma.price.findMany).mockResolvedValue([])
    const { generateMedicinePdf } = await import('@/lib/actions/pdf-report')
    const buffer = await generateMedicinePdf(2)
    expect(buffer).toBeDefined()
  })
})

describe('admin - getImportInfo with null lastMedicine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null for lastImport when no medicine', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue(null)
    const { getImportInfo } = await import('@/lib/actions/admin')
    const result = await getImportInfo()
    expect(result?.total).toBe(0)
    expect(result?.lastImport).toBeNull()
  })
})
