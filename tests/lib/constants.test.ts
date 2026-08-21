import { describe, it, expect } from 'vitest'
import {
  MEDICINE_LIMITS,
  BATCH,
  YEARS,
  STORAGE_KEYS,
  THEME_COLORS,
  PDF_COLORS,
} from '@/lib/constants'

describe('MEDICINE_LIMITS', () => {
  it('has expected numeric limits', () => {
    expect(MEDICINE_LIMITS.MAX_SIMILARES).toBe(10)
    expect(MEDICINE_LIMITS.SEARCH_LIMIT).toBe(20)
    expect(MEDICINE_LIMITS.DEFAULT_TOP_K).toBe(20)
    expect(typeof MEDICINE_LIMITS.MAX_SIMILARES).toBe('number')
  })
})

describe('BATCH', () => {
  it('has import batch sizes', () => {
    expect(BATCH.MEDICINE_IMPORT).toBe(500)
    expect(BATCH.PRICE_IMPORT).toBe(500)
  })
})

describe('YEARS', () => {
  it('has min and max year strings', () => {
    expect(YEARS.MIN).toBe('2000')
    expect(YEARS.MAX).toBe('2030')
  })
})

describe('STORAGE_KEYS', () => {
  it('has localStorage key strings', () => {
    expect(typeof STORAGE_KEYS.THEME).toBe('string')
    expect(typeof STORAGE_KEYS.FAVORITES).toBe('string')
    expect(typeof STORAGE_KEYS.RECENT_SEARCHES).toBe('string')
  })
})

describe('THEME_COLORS', () => {
  it('has hex color strings', () => {
    expect(THEME_COLORS.LIGHT).toMatch(/^#[0-9a-f]{6}$/i)
    expect(THEME_COLORS.DARK).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('PDF_COLORS', () => {
  it('has hex color strings', () => {
    expect(PDF_COLORS.TEXT_PRIMARY).toMatch(/^#[0-9a-f]{6}$/i)
    expect(PDF_COLORS.TEXT_SECONDARY).toMatch(/^#[0-9a-f]{6}$/i)
    expect(PDF_COLORS.BG_STRIPE).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
