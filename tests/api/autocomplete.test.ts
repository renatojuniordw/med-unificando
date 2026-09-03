import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { SEARCH } from '@/lib/config'

vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRawUnsafe: vi.fn() },
}))

import { prisma } from '@/lib/prisma'

function makeRequest(query: string) {
  return new NextRequest(`http://localhost/api/autocomplete${query}`)
}

async function get(query: string) {
  const { GET } = await import('@/app/api/autocomplete/route')
  return GET(makeRequest(query))
}

describe('GET /api/autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty suggestions for a query shorter than 2 chars without touching the DB', async () => {
    const res = await get('?q=a')
    const body = await res.json()
    expect(body.suggestions).toEqual([])
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled()
  })

  it('clamps the limit to 20 when a larger limit is requested', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])
    await get('?q=di&limit=500')
    const args = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0]
    expect(args[1]).toBe('di')
    expect(args[2]).toBe(20)
  })

  it('uses the default take when the limit is not a valid positive number', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])
    await get('?q=di&limit=abc')
    const args = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0]
    expect(args[2]).toBe(SEARCH.AUTOCOMPLETE_TAKE)
  })

  it('passes a small valid limit through', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])
    await get('?q=di&limit=5')
    const args = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0]
    expect(args[2]).toBe(5)
  })

  it('maps rows to label/sublabel preferring tradeName', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { tradeName: 'DIPIRONA', activeIngredient: 'Dipirona' },
      { tradeName: '', activeIngredient: 'Paracetamol' },
    ] as never)

    const res = await get('?q=dip')
    const body = await res.json()
    expect(body.suggestions).toEqual([
      { label: 'DIPIRONA', sublabel: 'Dipirona' },
      { label: 'Paracetamol', sublabel: null },
    ])
  })

  it('returns empty suggestions with 500 on database failure', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('db down'))

    const res = await get('?q=dip')
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.suggestions).toEqual([])
  })
})