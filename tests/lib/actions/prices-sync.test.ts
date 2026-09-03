import { describe, it, expect, vi, beforeEach } from 'vitest'

// withAdmin executa o callback diretamente em testes (passa auth).
vi.mock('@/lib/auth-guard', () => ({
  withAdmin: (fn: (...a: unknown[]) => unknown) => fn(),
  withAdminReturn: (_fallback: unknown, fn: () => unknown) => fn(),
}))

vi.mock('@/lib/csv-utils', () => ({
  downloadCsv: vi.fn(),
  parseCsvToRows: vi.fn(),
}))

const txMocks = {
  $executeRaw: vi.fn(),
  price: { deleteMany: vi.fn(), createMany: vi.fn() },
  syncLog: { create: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(txMocks)),
    price: { deleteMany: vi.fn(), createMany: vi.fn() },
    syncLog: { create: vi.fn() },
  },
}))

import { downloadCsv, parseCsvToRows } from '@/lib/csv-utils'
import { prisma } from '@/lib/prisma'
import { syncPrices } from '@/lib/actions/prices'

describe('syncPrices — transação (Fase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(downloadCsv).mockResolvedValue('csv')
    vi.mocked(parseCsvToRows).mockReturnValue([
      { NU_REGISTRO: '1234567890123', NU_PF0_INTEIRO: '1,99', NU_PF18_INTEIRO: '2,49', NU_CNPJ: '123', NO_RAZAO_SOCIAL: 'X' },
    ])
  })

  it('executa deleteMany + createMany + syncLog DENTRO de uma única $transaction', async () => {
    const result = await syncPrices()

    expect(result.success).toBe(true)
    expect(prisma.price.deleteMany).not.toHaveBeenCalled() // só via tx
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(txMocks.$executeRaw).toHaveBeenCalled() // advisory lock
    expect(txMocks.price.deleteMany).toHaveBeenCalledTimes(1)
    expect(txMocks.price.createMany).toHaveBeenCalled()
    expect(txMocks.syncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'prices', status: 'success' }) })
    )
  })

  it('não recria linhas quando a transação falha (rollback: nada acontece fora dela)', async () => {
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('boom'))

    const result = await syncPrices()

    expect(result.success).toBe(false)
    // No erro, o catch registra syncLog de erro; nenhum createMany parcial ocorreu.
    expect(txMocks.price.createMany).not.toHaveBeenCalled()
  })
})