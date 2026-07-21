import { describe, it, expect } from 'vitest'
import { getAtcDescription, getAtcLevel } from '@/lib/dictionaries/atc-codes'

describe('atcCodes', () => {
  it('returns description for known level-1 code', () => {
    expect(getAtcDescription('N')).toBe('SISTEMA NERVOSO')
  })

  it('returns null for unknown code', () => {
    expect(getAtcDescription('ZZ')).toBeNull()
  })

  it('handles null', () => {
    expect(getAtcDescription(null)).toBeNull()
  })

  it('handles empty string', () => {
    expect(getAtcDescription('')).toBeNull()
  })

  it('is case insensitive', () => {
    expect(getAtcDescription('n')).toBe('SISTEMA NERVOSO')
  })

  it('returns hierarchical level info', () => {
    const level = getAtcLevel('N06AB04')
    expect(level.level1).toBe('N')
    expect(level.level2).toBe('N06')
    expect(level.level3).toBe('N06A')
    expect(level.fullCode).toBe('N06AB04')
  })

  it('handles short codes in getAtcLevel', () => {
    const level = getAtcLevel('N')
    expect(level.level1).toBe('N')
    expect(level.level2).toBeNull()
    expect(level.level3).toBeNull()
    expect(level.fullCode).toBe('N')
  })
})
