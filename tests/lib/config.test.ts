import { describe, it, expect } from 'vitest'
import { ANVISA } from '@/lib/config'

describe('ANVISA config', () => {
  it('has MEDICINES_URL defined', () => {
    expect(ANVISA.MEDICINES_URL).toBeDefined()
    expect(typeof ANVISA.MEDICINES_URL).toBe('string')
  })

  it('has PRICES_URL defined', () => {
    expect(ANVISA.PRICES_URL).toBeDefined()
    expect(typeof ANVISA.PRICES_URL).toBe('string')
  })

  it('has valid URL format', () => {
    expect(ANVISA.MEDICINES_URL).toMatch(/^https?:\/\//)
    expect(ANVISA.PRICES_URL).toMatch(/^https?:\/\//)
  })
})
