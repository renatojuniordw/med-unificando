import { describe, it, expect } from 'vitest'
import { safeJsonLd } from '@/lib/safe-json-ld'

describe('safeJsonLd', () => {
  it('escapes <, > and & to prevent script-tag breakout', () => {
    const out = safeJsonLd({ name: '</script>&alert(1)' })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c/script\\u003e')
    expect(out).toContain('\\u0026')
  })

  it('escapes the U+2028 and U+2029 line separators', () => {
    const out = safeJsonLd({ a: '\u2028\u2029' })
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('serializes plain values without breaking', () => {
    expect(safeJsonLd('ola')).toBe(JSON.stringify('ola'))
    expect(safeJsonLd(null)).toBe('null')
    expect(safeJsonLd(42)).toBe('42')
  })

  it('keeps valid JSON when the escaped characters are reversed', () => {
    const value = { name: '</script>' }
    const escaped = safeJsonLd(value)
    const reversed = escaped.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>')
    expect(reversed).toBe(JSON.stringify(value))
  })
})