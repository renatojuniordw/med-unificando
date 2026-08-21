import { describe, it, expect } from 'vitest'
import {
  stripAccents,
  normalizeQuery,
  PHARMACEUTICAL_FORMS,
  THERAPEUTIC_CLASSES,
} from '@/lib/text-utils'

describe('stripAccents', () => {
  it('removes accents from accented characters', () => {
    expect(stripAccents('pressão')).toBe('pressao')
    expect(stripAccents('ação')).toBe('acao')
    expect(stripAccents('café')).toBe('cafe')
  })

  it('returns unchanged string without accents', () => {
    expect(stripAccents('hello')).toBe('hello')
    expect(stripAccents('123')).toBe('123')
  })

  it('handles empty string', () => {
    expect(stripAccents('')).toBe('')
  })

  it('handles mixed accented and non-accented', () => {
    expect(stripAccents('dor de cabeça')).toBe('dor de cabeca')
  })
})

describe('normalizeQuery', () => {
  it('lowercases and trims', () => {
    expect(normalizeQuery('  DOR  ')).toBe('dor')
  })

  it('strips "remédio para" prefix', () => {
    expect(normalizeQuery('Remédio para dor')).toBe('dor')
  })

  it('strips "remedio para" prefix (no accent)', () => {
    expect(normalizeQuery('remedio para febre')).toBe('febre')
  })

  it('strips "medicamento para" prefix', () => {
    expect(normalizeQuery('Medicamento para tosse')).toBe('tosse')
  })

  it('strips "tomar" prefix', () => {
    expect(normalizeQuery('tomar paracetamol')).toBe('paracetamol')
  })

  it('strips "preciso de" prefix', () => {
    expect(normalizeQuery('preciso de insulina')).toBe('insulina')
  })

  it('strips "quero" prefix', () => {
    expect(normalizeQuery('quero ibuprofeno')).toBe('ibuprofeno')
  })

  it('strips "buscar" prefix', () => {
    expect(normalizeQuery('buscar dipirona')).toBe('dipirona')
  })

  it('strips "procurar" prefix', () => {
    expect(normalizeQuery('procurar amoxicilina')).toBe('amoxicilina')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeQuery('  multiple   spaces  ')).toBe('multiple spaces')
  })

  it('handles empty string', () => {
    expect(normalizeQuery('')).toBe('')
  })
})

describe('PHARMACEUTICAL_FORMS', () => {
  it('is a Set with known forms', () => {
    expect(PHARMACEUTICAL_FORMS).toBeInstanceOf(Set)
    expect(PHARMACEUTICAL_FORMS.has('xarope')).toBe(true)
    expect(PHARMACEUTICAL_FORMS.has('comprimido')).toBe(true)
    expect(PHARMACEUTICAL_FORMS.has('creme')).toBe(true)
  })
})

describe('THERAPEUTIC_CLASSES', () => {
  it('is a Set with known classes', () => {
    expect(THERAPEUTIC_CLASSES).toBeInstanceOf(Set)
    expect(THERAPEUTIC_CLASSES.has('antialérgico')).toBe(true)
    expect(THERAPEUTIC_CLASSES.has('anti-inflamatório')).toBe(true)
    expect(THERAPEUTIC_CLASSES.has('antibiótico')).toBe(true)
  })
})
