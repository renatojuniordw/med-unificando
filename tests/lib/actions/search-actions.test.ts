import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  searchAutocomplete,
  getHolderMedicines,
  getHolderSummary,
  countMedicines,
  searchMedicines,
} from '@/lib/actions/search'
import { getMedicinesByIds, searchMedicinesForCompare } from '@/lib/actions/compare'

describe('searchAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty list for an empty query without hitting the DB', async () => {
    await expect(searchAutocomplete('tradeName', '  ')).resolves.toEqual([])
    expect(prisma.medicine.findMany).not.toHaveBeenCalled()
  })

  it('returns an empty list for a field outside the allowlist', async () => {
    await expect(searchAutocomplete('dangerousField', 'x')).resolves.toEqual([])
    expect(prisma.medicine.findMany).not.toHaveBeenCalled()
  })

  it('queries distinct insensitive values and filters falsy results', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { category: 'Referência' },
      { category: 'Genérico' },
      { category: null },
    ] as never)

    const result = await searchAutocomplete('category', 'generic')

    expect(prisma.medicine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { category: true },
        distinct: ['category'],
        where: { category: { contains: 'generic', mode: 'insensitive' } },
      })
    )
    expect(result).toEqual([{ value: 'Referência' }, { value: 'Genérico' }])
  })
})

describe('getHolderMedicines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters by holder and returns normalized paginated data', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, tradeName: 'Med A', activeIngredient: 'Ing' },
    ] as never)
    vi.mocked(prisma.medicine.count).mockResolvedValue(1)

    const result = await getHolderMedicines('ABC', 1, 20)

    expect(prisma.medicine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { similarHolder: { contains: 'ABC', mode: 'insensitive' } },
        skip: 0,
        take: 20,
        orderBy: { tradeName: 'asc' },
      })
    )
    expect(result).toMatchObject({ page: 1, pageSize: 20, total: 1 })
    expect(result.data).toHaveLength(1)
  })

  it('adds search and status filters when provided', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)

    await getHolderMedicines('ABC', 1, 20, 'dor', 'Ativo')

    const args = vi.mocked(prisma.medicine.findMany).mock.calls[0][0]
    expect(args).toBeDefined()
    const where = args!.where ?? {}
    expect(where).toMatchObject({
      similarHolder: { contains: 'ABC', mode: 'insensitive' },
      OR: [
        { tradeName: { contains: 'dor', mode: 'insensitive' } },
        { activeIngredient: { contains: 'dor', mode: 'insensitive' } },
      ],
      status: { equals: 'Ativo', mode: 'insensitive' },
    })
  })
})

describe('getHolderSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the stored holder name and aggregates counts', async () => {
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue({ similarHolder: 'Empresa X' } as never)
    vi.mocked(prisma.medicine.count).mockResolvedValueOnce(10).mockResolvedValueOnce(7)
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([{ category: 'A' }, { category: 'B' }, { category: 'C' }] as never)

    const result = await getHolderSummary('ABC')

    expect(result).toEqual({ holderName: 'Empresa X', total: 10, ativos: 7, categoriasCount: 3 })
    expect(prisma.medicine.count).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: expect.objectContaining({ status: 'Ativo' }) }))
  })

  it('falls back to the holder param when no row is found', async () => {
    vi.mocked(prisma.medicine.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([])

    const result = await getHolderSummary('ABC')

    expect(result.holderName).toBe('ABC')
    expect(result.categoriasCount).toBe(0)
  })
})

describe('countMedicines', () => {
  it('delegates the filters to the DB count', async () => {
    vi.mocked(prisma.medicine.count).mockResolvedValue(5)
    const result = await countMedicines({ category: 'Genérico' })
    expect(result).toBe(5)
    expect(prisma.medicine.count).toHaveBeenCalled()
  })
})

describe('compare actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMedicinesByIds returns an empty list for empty ids without querying', async () => {
    await expect(getMedicinesByIds([])).resolves.toEqual([])
    expect(prisma.medicine.findMany).not.toHaveBeenCalled()
  })

  it('searchMedicinesForCompare returns an empty list for queries shorter than 2 chars', async () => {
    await expect(searchMedicinesForCompare('a')).resolves.toEqual([])
    expect(prisma.medicine.findMany).not.toHaveBeenCalled()
  })

  it('searchMedicinesForCompare maps matches to id/label', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, reference: 'REF1', tradeName: 'Med', activeIngredient: 'Ing' },
    ] as never)

    const result = await searchMedicinesForCompare('dipirona')

    expect(prisma.medicine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, orderBy: { reference: 'asc' } })
    )
    expect(result).toEqual([{ id: 1, label: 'REF1 — Med (Ing)' }])
  })
})

describe('searchMedicines — clamp de pageSize (Fase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([])
    vi.mocked(prisma.medicine.count).mockResolvedValue(0)
  })

  it('limita pageSize acima do máximo a MEDICINE_LIMITS.MAX_PAGE_SIZE (100)', async () => {
    const result = await searchMedicines(1, 100_000)
    expect(prisma.medicine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100, skip: 0 })
    )
    expect(result.pageSize).toBe(100)
  })

  it('normaliza page/pageSize abaixo de 1 para 1', async () => {
    const result = await searchMedicines(-3, -5)
    expect(prisma.medicine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1, skip: 0 })
    )
    expect(result).toMatchObject({ page: 1, pageSize: 1 })
  })
})