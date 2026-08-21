import { describe, it, expect } from 'vitest'
import { getRelevanceLabel } from '@/lib/search-relevance'

describe('getRelevanceLabel', () => {
  it('returns high tier for score >= 0.50', () => {
    expect(getRelevanceLabel(0.50)).toEqual({ tier: 'high', label: 'Alta correspondência' })
    expect(getRelevanceLabel(0.75)).toEqual({ tier: 'high', label: 'Alta correspondência' })
    expect(getRelevanceLabel(1.0)).toEqual({ tier: 'high', label: 'Alta correspondência' })
  })

  it('returns medium tier for score >= 0.25 and < 0.50', () => {
    expect(getRelevanceLabel(0.25)).toEqual({ tier: 'medium', label: 'Correspondência parcial' })
    expect(getRelevanceLabel(0.49)).toEqual({ tier: 'medium', label: 'Correspondência parcial' })
  })

  it('returns low tier for score < 0.25', () => {
    expect(getRelevanceLabel(0.24)).toEqual({ tier: 'low', label: 'Baixa correspondência' })
    expect(getRelevanceLabel(0.0)).toEqual({ tier: 'low', label: 'Baixa correspondência' })
    expect(getRelevanceLabel(0.1)).toEqual({ tier: 'low', label: 'Baixa correspondência' })
  })
})
