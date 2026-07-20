import { describe, it, expect } from 'vitest'

function escapeCsv(val: unknown): string {
  return `"${String(val ?? '').replace(/"/g, '""')}"`
}

describe('escapeCsv', () => {
  it('wraps normal text in double quotes', () => {
    expect(escapeCsv('hello')).toBe('"hello"')
  })

  it('handles undefined value', () => {
    expect(escapeCsv(undefined)).toBe('""')
  })

  it('handles null value', () => {
    expect(escapeCsv(null)).toBe('""')
  })

  it('handles empty string', () => {
    expect(escapeCsv('')).toBe('""')
  })

  it('escapes double quotes by doubling them', () => {
    expect(escapeCsv('say "hello"')).toBe('"say ""hello"""')
  })

  it('handles numbers', () => {
    expect(escapeCsv(42)).toBe('"42"')
  })

  it('handles strings with commas', () => {
    expect(escapeCsv('a,b,c')).toBe('"a,b,c"')
  })

  it('handles strings with newlines', () => {
    expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"')
  })
})
