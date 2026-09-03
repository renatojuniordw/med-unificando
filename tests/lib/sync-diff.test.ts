import { describe, it, expect } from 'vitest'
import { computeFingerprint, planDiff, type DiffRow } from '@/lib/sync-diff'

const KEYS = ['reference', 'tradeName', 'status']

function row(partial: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    reference: 'R1',
    tradeName: 'Med',
    status: 'Ativo',
    ...partial,
  }
}

describe('computeFingerprint', () => {
  it('é determinístico e independente da ordem dos valores', () => {
    const a = computeFingerprint({ a: 1, b: 'x' }, ['a', 'b'])
    const b = computeFingerprint({ b: 'x', a: 1 }, ['a', 'b'])
    expect(a).toBe(b)
  })

  it('normaliza null e ausência como equivalentes (chave incluída)', () => {
    expect(computeFingerprint({ a: null }, ['a'])).toBe(computeFingerprint({ a: null }, ['a']))
    // Linha com campo null e linha sem o campo são iguais para o diff (coluna com
    // valor NULL) — normalização intencional, não distingue.
    expect(computeFingerprint({}, ['a'])).toBe(computeFingerprint({ a: null }, ['a']))
  })
})

describe('planDiff', () => {
  it('dataset idêntico → tudo unchanged, nada para criar/atualizar/apagar', () => {
    const existing: DiffRow[] = [
      { id: 1, ...row({}) },
      { id: 2, ...row({ reference: 'R2', status: 'Inativo' }) },
    ] as DiffRow[]
    const incoming = [row({}), row({ reference: 'R2', status: 'Inativo' })]

    const plan = planDiff(existing, incoming, KEYS, 'reference')
    expect(plan.unchanged).toBe(2)
    expect(plan.toCreate).toEqual([])
    expect(plan.toUpdate).toEqual([])
    expect(plan.toDeleteIds).toEqual([])
  })

  it('linha nova → toCreate sem tocar nos ids existentes', () => {
    const existing: DiffRow[] = [{ id: 1, ...row({}) }] as DiffRow[]
    const incoming = [row({}), row({ reference: 'NOVO', tradeName: 'Genérico' })]

    const plan = planDiff(existing, incoming, KEYS, 'reference')
    expect(plan.toCreate).toHaveLength(1)
    expect(plan.toCreate[0]).toMatchObject({ reference: 'NOVO' })
    expect(plan.toDeleteIds).toEqual([])
    expect(plan.unchanged).toBe(1)
  })

  it('linha alterada → toUpdate mantendo o id original e só com os campos que mudaram', () => {
    const existing: DiffRow[] = [{ id: 42, ...row({ status: 'Ativo' }) }] as DiffRow[]
    const incoming = [row({ status: 'Inativo' })]

    const plan = planDiff(existing, incoming, KEYS, 'reference')
    expect(plan.toUpdate).toEqual([{ id: 42, patch: { status: 'Inativo' } }])
    expect(plan.toCreate).toEqual([])
    expect(plan.toDeleteIds).toEqual([])
    expect(plan.unchanged).toBe(0)
  })

  it('linha removida → toDeleteIds com o id', () => {
    const existing: DiffRow[] = [
      { id: 1, ...row({}) },
      { id: 2, ...row({ reference: 'R2' }) },
    ] as DiffRow[]
    const incoming = [row({})]

    const plan = planDiff(existing, incoming, KEYS, 'reference')
    expect(plan.toDeleteIds).toEqual([2])
    expect(plan.toCreate).toEqual([])
  })

  it('reordenação do dataset → nenhuma mudança (matching por fingerprint, não posição)', () => {
    const existing: DiffRow[] = [
      { id: 1, ...row({ reference: 'A' }) },
      { id: 2, ...row({ reference: 'B' }) },
    ] as DiffRow[]
    const incoming = [row({ reference: 'B' }), row({ reference: 'A' })]

    const plan = planDiff(existing, incoming, KEYS, 'reference')
    expect(plan.unchanged).toBe(2)
    expect(plan.toUpdate).toEqual([])
    expect(plan.toCreate).toEqual([])
  })

  it('duplicatas idênticas preservam ids por multiplicidade (caso BIMOXIN)', () => {
    const existing: DiffRow[] = [
      { id: 100, reference: 'X', tradeName: 'M', status: 'Ativo' },
      { id: 101, reference: 'X', tradeName: 'M', status: 'Ativo' },
    ] as DiffRow[]
    const incoming = [
      { reference: 'X', tradeName: 'M', status: 'Ativo' },
      { reference: 'X', tradeName: 'M', status: 'Ativo' },
      { reference: 'X', tradeName: 'M', status: 'Ativo' }, // 3ª ocorrência
    ]

    const plan = planDiff(existing, incoming, KEYS, 'reference')
    expect(plan.unchanged).toBe(2) // 2 de 3 casam com existentes
    expect(plan.toCreate).toHaveLength(1) // 3º vira INSERT
    expect(plan.toDeleteIds).toEqual([])
  })
})