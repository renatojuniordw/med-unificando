import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicine: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('getReferenceMedicines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns grouped reference medicines', async () => {
    vi.mocked(prisma.medicine.groupBy).mockResolvedValue([
      { referenceMedicine: 'Novalgina', _count: { referenceMedicine: 50 } },
      { referenceMedicine: 'Lexapro', _count: { referenceMedicine: 30 } },
    ] as never)

    const { getReferenceMedicines } = await import('@/lib/actions/references')
    const result = await getReferenceMedicines()

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Novalgina')
    expect(result[0].count).toBe(50)
  })
})

describe('getSimilaresByReference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns medicines by reference name', async () => {
    vi.mocked(prisma.medicine.findMany).mockResolvedValue([
      { id: 1, tradeName: 'Similar1', referenceMedicine: 'Novalgina' },
    ] as never)

    const { getSimilaresByReference } = await import('@/lib/actions/references')
    const result = await getSimilaresByReference('Novalgina')

    expect(result).toHaveLength(1)
    expect(result[0].tradeName).toBe('Similar1')
  })
})
