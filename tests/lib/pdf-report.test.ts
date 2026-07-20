import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findUnique: vi.fn(),
    },
    price: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('generateMedicinePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error when medicine not found', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue(null)

    const { generateMedicinePdf } = await import('@/lib/actions/pdf-report')
    await expect(generateMedicinePdf(999)).rejects.toThrow('Medicamento não encontrado')
  })

  it('generates PDF buffer when medicine exists', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue({
      id: 1,
      reference: '12345',
      tradeName: 'TestMed',
      activeIngredient: 'TestIngredient',
      similarHolder: 'TestHolder',
      pharmaceuticalForm: 'Tablet',
      concentration: '100mg',
      category: 'Similar',
      status: 'Ativo',
    } as never)
    vi.mocked(prisma.price.findMany).mockResolvedValue([])

    const { generateMedicinePdf } = await import('@/lib/actions/pdf-report')
    const buffer = await generateMedicinePdf(1)

    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(0)
    // PDF header bytes
    expect(buffer[0]).toBe(0x25) // %
    expect(buffer[1]).toBe(0x50) // P
    expect(buffer[2]).toBe(0x44) // D
    expect(buffer[3]).toBe(0x46) // F
  })

  it('includes prices in PDF when available', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue({
      id: 1,
      reference: '12345',
      tradeName: 'TestMed',
      activeIngredient: 'TestIngredient',
    } as never)
    vi.mocked(prisma.price.findMany).mockResolvedValue([
      { id: 1, presentation: '10mg 30 comp', pf0Price: 15.5, pf18Price: 18.9 },
    ] as never)

    const { generateMedicinePdf } = await import('@/lib/actions/pdf-report')
    const buffer = await generateMedicinePdf(1)

    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer[0]).toBe(0x25) // PDF header
  })
})
