import { describe, it, expect } from 'vitest'
import { getPrescriptionTypeName } from '@/lib/dictionaries/prescription-types'

describe('prescriptionTypes', () => {
  it('returns name for known single code', () => {
    expect(getPrescriptionTypeName('1')).toBe('VENDA SOB PRESCRIÇÃO MÉDICA')
  })

  it('returns raw code for unknown code (fallback)', () => {
    expect(getPrescriptionTypeName('99')).toBe('99')
  })

  it('normalizes whitespace', () => {
    expect(getPrescriptionTypeName(' 1 ')).toBe('VENDA SOB PRESCRIÇÃO MÉDICA')
  })

  it('handles null', () => {
    expect(getPrescriptionTypeName(null)).toBeNull()
  })

  it('handles undefined', () => {
    expect(getPrescriptionTypeName(undefined)).toBeNull()
  })

  it('handles empty string', () => {
    expect(getPrescriptionTypeName('')).toBeNull()
  })

  it('resolves multi-code combinations', () => {
    const result = getPrescriptionTypeName('2, 1')
    expect(result).toBe('TARJA VERMELHA, VENDA SOB PRESCRIÇÃO MÉDICA')
  })

  it('falls back to raw code if any part is unknown', () => {
    // '2, 99' — 99 is unknown, so return raw code
    const result = getPrescriptionTypeName('2, 99')
    expect(result).toBe('2, 99')
  })
})
