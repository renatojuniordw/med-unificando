import { describe, it, expect } from 'vitest'
import { getSynonymExpansion, buildOrTsQuery, buildExpandedTsquery } from '@/lib/keyword-utils'

describe('getSynonymExpansion', () => {
  it('always includes the stripped query', () => {
    const result = getSynonymExpansion('dor')
    expect(result).toContain('dor')
  })

  it('expands via SYNONYM_MAP', () => {
    const result = getSynonymExpansion('dor')
    expect(result).toContain('analgesico')
    expect(result).toContain('anti-inflamatorio')
  })

  it('strips "remédio para" prefix before expanding', () => {
    const result = getSynonymExpansion('remédio para dor')
    expect(result).toContain('dor')
    expect(result).toContain('analgesico')
  })

  it('expands compound subjects', () => {
    const result = getSynonymExpansion('cabeça')
    expect(result).toContain('cefaleia')
    expect(result).toContain('migrânea')
  })

  it('expands individual words in multi-word queries', () => {
    const result = getSynonymExpansion('dor de estomago')
    expect(result).toContain('dor')
    expect(result).toContain('estomago')
  })

  it('handles empty query', () => {
    const result = getSynonymExpansion('')
    expect(result).toContain('')
  })

  it('handles query with no matches', () => {
    const result = getSynonymExpansion('xyzabc')
    expect(result).toContain('xyzabc')
  })
})

describe('buildOrTsQuery', () => {
  it('returns single sanitized term', () => {
    const result = buildOrTsQuery(['dor'])
    expect(result).toBe('dor')
  })

  it('joins multi-word term with AND', () => {
    const result = buildOrTsQuery(['dor de cabeca'])
    expect(result).toBe('(dor & cabeca)')
  })

  it('joins multiple terms with OR', () => {
    const result = buildOrTsQuery(['dor', 'febre'])
    expect(result).toBe('dor | febre')
  })

  it('removes stop words', () => {
    const result = buildOrTsQuery(['dor de cabeca'])
    // "de" is a stop word and should be removed
    expect(result).not.toContain(' de ')
    expect(result).toContain('dor')
    expect(result).toContain('cabeca')
  })

  it('sanitizes special characters within words', () => {
    const result = buildOrTsQuery(["test'other"])
    // Apostrophe is sanitized to space, splitting into separate words
    expect(result).not.toContain("'")
  })

  it('returns empty string for empty terms', () => {
    const result = buildOrTsQuery([])
    expect(result).toBe('')
  })

  it('returns empty string when all terms are stop words', () => {
    const result = buildOrTsQuery(['de', 'para', 'com'])
    expect(result).toBe('')
  })
})

describe('buildExpandedTsquery', () => {
  it('returns expanded tsquery for valid query', () => {
    const result = buildExpandedTsquery('dor')
    expect(result).toBeTruthy()
    expect(result).toContain('dor')
  })

  it('strips "remédio para" prefix', () => {
    const result = buildExpandedTsquery('remédio para dor')
    expect(result).toBeTruthy()
    expect(result).toContain('dor')
  })

  it('returns null for empty query', () => {
    expect(buildExpandedTsquery('')).toBeNull()
  })

  it('returns null for single character query', () => {
    expect(buildExpandedTsquery('a')).toBeNull()
  })

  it('strips "medicamento para" prefix', () => {
    const result = buildExpandedTsquery('medicamento para febre')
    expect(result).toBeTruthy()
    expect(result).toContain('febre')
  })
})
