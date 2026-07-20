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

vi.mock('@/lib/pdf-parser', () => ({
  parseMedicinePDF: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('admin - importPdf edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { importPdf } = await import('@/lib/actions/admin')
    const result = await importPdf(new FormData())
    expect(result.error).toContain('Não autorizado')
  })

  it('returns error when PDF has no medicines', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    const pdfParser = await import('@/lib/pdf-parser')
    vi.mocked(pdfParser.parseMedicinePDF).mockResolvedValue([])

    const { importPdf } = await import('@/lib/actions/admin')
    const fd = new FormData()
    fd.set('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }))
    const result = await importPdf(fd)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Nenhum medicamento')
  })

  it('handles PDF parse error', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    const pdfParser = await import('@/lib/pdf-parser')
    vi.mocked(pdfParser.parseMedicinePDF).mockRejectedValue(new Error('PDF parse error'))

    const { importPdf } = await import('@/lib/actions/admin')
    const fd = new FormData()
    fd.set('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }))
    const result = await importPdf(fd)
    expect(result.success).toBe(false)
    expect(result.error).toContain('PDF')
  })
})

describe('admin - syncWithAnvisa unauthorized', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { syncWithAnvisa } = await import('@/lib/actions/admin')
    const result = await syncWithAnvisa()
    expect(result.error).toContain('Não autorizado')
  })
})

describe('admin - getImportInfo no medicines', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null lastImport when no medicine found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } })
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue(null)
    const { getImportInfo } = await import('@/lib/actions/admin')
    const result = await getImportInfo()
    expect(result?.lastImport).toBeNull()
    expect(result?.total).toBe(0)
  })
})
