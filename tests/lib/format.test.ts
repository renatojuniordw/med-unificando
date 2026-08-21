import { describe, it, expect } from 'vitest'
import { normalizeText, normalizeMedicine } from '@/lib/format'

describe('normalizeText', () => {
  it('capitalizes the first word', () => {
    expect(normalizeText('hello')).toBe('Hello')
  })

  it('lowercases stop words in positions after the first', () => {
    expect(normalizeText('Dor de Cabeca')).toBe('Dor de Cabeca')
  })

  it('capitalizes first word even if it is a stop word', () => {
    expect(normalizeText('de la roche')).toBe('De La Roche')
  })

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('')
  })

  it('handles single word', () => {
    expect(normalizeText('ibuprofeno')).toBe('Ibuprofeno')
  })

  it('handles all uppercase input', () => {
    expect(normalizeText('DOR DE CABECA')).toBe('Dor de Cabeca')
  })

  it('handles all lowercase input', () => {
    expect(normalizeText('dor de cabeca')).toBe('Dor de Cabeca')
  })

  it('preserves non-stop words capitalization', () => {
    expect(normalizeText('paracetamol com codeina')).toBe('Paracetamol com Codeina')
  })
})

describe('normalizeMedicine', () => {
  it('normalizes normalizable fields', () => {
    const input = { activeIngredient: 'ibuprofeno', tradeName: 'dorflex' }
    const result = normalizeMedicine(input)
    expect(result.activeIngredient).toBe('Ibuprofeno')
    expect(result.tradeName).toBe('Dorflex')
  })

  it('does not normalize empty string fields', () => {
    const input = { activeIngredient: '' }
    const result = normalizeMedicine(input)
    expect(result.activeIngredient).toBe('')
  })

  it('does not normalize non-normalizable fields', () => {
    const input = { id: 123, status: 'ativo' } as Record<string, unknown>
    const result = normalizeMedicine(input)
    expect(result.id).toBe(123)
    expect(result.status).toBe('ativo')
  })

  it('handles mixed normalizable and non-normalizable fields', () => {
    const input = {
      activeIngredient: 'paracetamol',
      id: 42,
      tradeName: 'tylenol',
      category: 'similar',
    }
    const result = normalizeMedicine(input)
    expect(result.activeIngredient).toBe('Paracetamol')
    expect(result.id).toBe(42)
    expect(result.tradeName).toBe('Tylenol')
    expect(result.category).toBe('Similar')
  })

  it('handles object with no normalizable fields', () => {
    const input = { id: 1, name: 'test' } as Record<string, unknown>
    const result = normalizeMedicine(input)
    expect(result).toEqual({ id: 1, name: 'test' })
  })
})
