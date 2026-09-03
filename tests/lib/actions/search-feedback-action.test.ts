import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { searchFeedback: { create: vi.fn() } },
}))

vi.mock('@/lib/auth-guard', () => ({
  withAdmin: (fn: (...a: unknown[]) => unknown) => fn(),
  withAdminReturn: (_f: unknown, fn: () => unknown) => fn(),
}))

vi.mock('@/lib/rate-limit-action', () => ({
  checkActionRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
  RATE_LIMIT_ERROR: 'Muitas requisições. Tente novamente em instantes.',
}))

import { prisma } from '@/lib/prisma'
import { submitSearchFeedback } from '@/lib/actions/search-feedback'

const VALID = {
  query: 'dipirona',
  medicineId: 12,
  medicineName: 'Dipirona 500mg',
  feedback: 'helpful',
}

describe('submitSearchFeedback — não vaza erro interno (Fase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna erro genérico quando o Prisma rejeita (sem expor a mensagem interna)', async () => {
    vi.mocked(prisma.searchFeedback.create).mockRejectedValue(
      new Error("PrismaClientKnownRequestError: insert into search_feedback ... constraint violation (P2002)")
    )

    const result = await submitSearchFeedback(VALID)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Erro ao salvar feedback')
    expect(result.error).not.toContain('PrismaClientKnownRequestError')
    expect(result.error).not.toContain('P2002')
  })

  it('aceita payload válido e persiste', async () => {
    vi.mocked(prisma.searchFeedback.create).mockResolvedValue({ id: 1 } as never)

    const result = await submitSearchFeedback(VALID)

    expect(result.success).toBe(true)
    expect(prisma.searchFeedback.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ query: 'dipirona' }) })
    )
  })
})