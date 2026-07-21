import { describe, it, expect } from 'vitest'
import { THERAPEUTIC_CLASSES } from '@/lib/dictionaries/therapeutic-classes'

describe('therapeuticClasses', () => {
  it('exports an array', () => {
    expect(Array.isArray(THERAPEUTIC_CLASSES)).toBe(true)
  })

  it('contains known therapeutic classes', () => {
    expect(THERAPEUTIC_CLASSES).toBeDefined()
  })
})
