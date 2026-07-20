import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/build-where', () => ({
  buildWhere: vi.fn().mockReturnValue({}),
}))

import { prisma } from '@/lib/prisma'

describe('exportToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns buffer with correct filename', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { reference: '123', activeIngredient: 'Test', tradeName: 'Med' },
    ] as never)

    const { exportToExcel } = await import('@/lib/actions/export-action')
    const result = await exportToExcel()

    expect(result.filename).toMatch(/^medicamentos-\d{4}-\d{2}-\d{2}\.xlsx$/)
    expect(result.buffer).toBeDefined()
    expect(result.buffer.length).toBeGreaterThan(0)
  })
})

describe('exportToCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns CSV with correct headers', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { reference: '123', activeIngredient: 'Test', tradeName: 'Med' },
    ] as never)

    const { exportToCsv } = await import('@/lib/actions/export-action')
    const result = await exportToCsv()

    expect(result.text).toContain('Referência')
    expect(result.text).toContain('Princípio Ativo')
    expect(result.text).toContain('Nome Comercial')
  })

  it('escapes double quotes in CSV values', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { reference: '123', activeIngredient: 'Test "special"', tradeName: 'Med' },
    ] as never)

    const { exportToCsv } = await import('@/lib/actions/export-action')
    const result = await exportToCsv()

    expect(result.text).toContain('"Test ""special"""')
  })
})
