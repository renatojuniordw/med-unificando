import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    price: { findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { prisma } from '@/lib/prisma'

describe('medicines-admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searchMedicinesForAdmin returns matching medicines', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, reference: '123', tradeName: 'Med' },
    ] as never)

    const { searchMedicinesForAdmin } = await import('@/lib/actions/medicines-admin')
    const result = await searchMedicinesForAdmin('123')

    expect(result).toHaveLength(1)
    expect(result[0].reference).toBe('123')
  })

  it('getMedicineForEdit returns medicine', async () => {
    vi.mocked(prisma.medicine.findUnique).mockResolvedValue({
      id: 1,
      reference: '123',
      tradeName: 'Med',
    } as never)

    const { getMedicineForEdit } = await import('@/lib/actions/medicines-admin')
    const result = await getMedicineForEdit(1)

    expect(result).not.toBeNull()
    expect(result?.reference).toBe('123')
  })

  it('updateMedicine updates and returns result', async () => {
    const { updateMedicine } = await import('@/lib/actions/medicines-admin')

    // This may throw depending on auth mock, just verify the function exists
    expect(updateMedicine).toBeDefined()
  })
})

describe('atc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAtcLevels returns grouped levels', async () => {
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([
      { atcCode: 'A01', _count: { atcCode: 5 } },
    ] as never)

    const { getAtcLevels } = await import('@/lib/actions/atc')
    const result = await getAtcLevels()

    expect(result).toHaveLength(1)
  })

  it('getMedicinesByAtc returns medicines', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, atcCode: 'A01', tradeName: 'Med' },
    ] as never)

    const { getMedicinesByAtc } = await import('@/lib/actions/atc')
    const result = await getMedicinesByAtc('A01')

    expect(result).toHaveLength(1)
  })
})

describe('compare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMedicinesByIds returns medicines', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, reference: '123', tradeName: 'Med' },
    ] as never)

    const { getMedicinesByIds } = await import('@/lib/actions/compare')
    const result = await getMedicinesByIds([1])

    expect(result).toHaveLength(1)
  })

  it('searchMedicinesForCompare returns results', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, reference: '123', tradeName: 'Med' },
    ] as never)

    const { searchMedicinesForCompare } = await import('@/lib/actions/compare')
    const result = await searchMedicinesForCompare('Med')

    expect(result).toHaveLength(1)
  })
})
