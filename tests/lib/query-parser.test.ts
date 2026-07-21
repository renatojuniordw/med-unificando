import { describe, it, expect } from 'vitest'
import { parseQuery } from '@/lib/query-parser'

describe('queryParser', () => {
  it('detects pharmaceutical form in query', () => {
    const result = parseQuery('xarope que contém antialérgico')
    expect(result.pharmaceuticalForms).toEqual(['xarope'])
    expect(result.therapeuticClasses).toEqual(['antialérgico'])
  })

  it('returns empty arrays for unrecognized terms', () => {
    const result = parseQuery('remédio para dormir')
    expect(result.pharmaceuticalForms).toEqual([])
    expect(result.therapeuticClasses).toEqual([])
    expect(result.otherTerms).toEqual(['remédio', 'para', 'dormir'])
  })

  it('detects multiple forms and classes', () => {
    const result = parseQuery('comprimido anti-inflamatório e pomada antibiótico')
    expect(result.pharmaceuticalForms).toContain('comprimido')
    expect(result.pharmaceuticalForms).toContain('pomada')
    expect(result.therapeuticClasses).toContain('anti-inflamatório')
    expect(result.therapeuticClasses).toContain('antibiótico')
  })

  it('handles empty query', () => {
    const result = parseQuery('')
    expect(result.pharmaceuticalForms).toEqual([])
    expect(result.therapeuticClasses).toEqual([])
    expect(result.otherTerms).toEqual([])
  })

  it('is case insensitive', () => {
    const result = parseQuery('XAROPE Antialérgico')
    expect(result.pharmaceuticalForms).toEqual(['xarope'])
    expect(result.therapeuticClasses).toEqual(['antialérgico'])
  })

  it('matches pharmaceutical forms even when dictionary values differ', () => {
    const result = parseQuery('xarope')
    expect(result.pharmaceuticalForms).toContain('xarope')
  })
})
