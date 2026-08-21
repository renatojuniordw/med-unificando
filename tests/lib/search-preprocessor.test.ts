import { describe, it, expect } from 'vitest'
import { classifyQuery } from '@/lib/search-preprocessor'

describe('classifyQuery', () => {
  it('returns condition with confidence 0 for empty query', () => {
    const result = classifyQuery('')
    expect(result.type).toBe('condition')
    expect(result.confidence).toBe(0)
  })

  it('detects "remédio para X" as condition', () => {
    const result = classifyQuery('remédio para dor')
    expect(result.type).toBe('condition')
    expect(result.confidence).toBe(0.9)
  })

  it('detects "remedio para X" (no accent) as condition', () => {
    const result = classifyQuery('remedio para febre')
    expect(result.type).toBe('condition')
    expect(result.confidence).toBe(0.9)
  })

  it('detects "medicamento para X" as condition', () => {
    const result = classifyQuery('medicamento para tosse')
    expect(result.type).toBe('condition')
    expect(result.confidence).toBe(0.9)
  })

  it('detects pharmaceutical form as condition with lower confidence', () => {
    const result = classifyQuery('xarope')
    expect(result.type).toBe('condition')
    expect(result.confidence).toBe(0.6)
  })

  it('detects therapeutic class', () => {
    const result = classifyQuery('antialérgico')
    expect(result.type).toBe('therapeutic-class')
    expect(result.confidence).toBe(0.8)
  })

  it('detects condition keyword', () => {
    const result = classifyQuery('dor')
    expect(result.type).toBe('condition')
    expect(result.confidence).toBe(0.85)
  })

  it('detects mixed type when 2+ categories present', () => {
    const result = classifyQuery('xarope antialérgico')
    expect(result.type).toBe('mixed')
    expect(result.confidence).toBe(0.7)
  })

  it('detects medicine name by suffix', () => {
    const result = classifyQuery('ibuprofeno')
    // "dor" is in SYNONYM_MAP values, so ibuprofeno won't match condition
    // But it's a short query (1 word) without condition markers
    expect(result.type).toBe('medicine-name')
    expect(result.confidence).toBe(0.75)
  })

  it('detects medicine name by short query without markers', () => {
    const result = classifyQuery('paracetamol')
    expect(result.type).toBe('medicine-name')
    expect(result.confidence).toBe(0.75)
  })

  it('does not classify long queries as medicine name', () => {
    const result = classifyQuery('remédio para dor de cabeça muito forte')
    // Has "remédio para" → condition
    expect(result.type).toBe('condition')
  })

  it('returns fallback for unrecognized long queries', () => {
    const result = classifyQuery('qual o melhor tratamento para')
    expect(result.type).toBe('condition')
    expect(result.confidence).toBeLessThanOrEqual(0.85)
  })
})
