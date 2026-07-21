import { describe, it, expect } from 'vitest'
import { getPharmaceuticalFormName } from '@/lib/dictionaries/pharmaceutical-forms'

describe('pharmaceuticalForms', () => {
  it('returns name for known code', () => {
    expect(getPharmaceuticalFormName('1')).toBe('ADESIVO TRANSDÉRMICO')
  })

  it('returns raw code for unknown code (fallback)', () => {
    expect(getPharmaceuticalFormName('999')).toBe('999')
  })

  it('normalizes whitespace', () => {
    expect(getPharmaceuticalFormName(' 1 ')).toBe('ADESIVO TRANSDÉRMICO')
  })

  it('handles null', () => {
    expect(getPharmaceuticalFormName(null)).toBeNull()
  })

  it('handles undefined', () => {
    expect(getPharmaceuticalFormName(undefined)).toBeNull()
  })

  it('handles empty string', () => {
    expect(getPharmaceuticalFormName('')).toBeNull()
  })

  it('resolves multi-code combinations by splitting on comma', () => {
    // "76, 79" should resolve to individual names joined
    const result = getPharmaceuticalFormName('76, 79')
    expect(result).toBeTruthy()
    expect(result).not.toBe('76, 79') // Should have been resolved
  })
})
