import { describe, it, expect } from 'vitest'
import { buildWhere } from '@/lib/build-where'

describe('buildWhere', () => {
  it('returns empty object when no filters provided', () => {
    expect(buildWhere()).toEqual({})
  })

  it('builds filter for reference', () => {
    const result = buildWhere({ reference: '12345' })
    expect(result).toEqual({
      reference: { contains: '12345', mode: 'insensitive' },
    })
  })

  it('builds filter for activeIngredient', () => {
    const result = buildWhere({ activeIngredient: 'ibuprofeno' })
    expect(result).toEqual({
      activeIngredient: { contains: 'ibuprofeno', mode: 'insensitive' },
    })
  })

  it('builds filter for tradeName', () => {
    const result = buildWhere({ tradeName: 'dorflex' })
    expect(result).toEqual({
      tradeName: { contains: 'dorflex', mode: 'insensitive' },
    })
  })

  it('builds filter for category', () => {
    const result = buildWhere({ category: 'Similar' })
    expect(result).toEqual({
      category: { contains: 'Similar', mode: 'insensitive' },
    })
  })

  it('builds filter for status', () => {
    const result = buildWhere({ status: 'Ativo' })
    expect(result).toEqual({
      status: { contains: 'Ativo', mode: 'insensitive' },
    })
  })

  it('builds filter for pharmaceuticalForm', () => {
    const result = buildWhere({ pharmaceuticalForm: 'comprimido' })
    expect(result).toEqual({
      pharmaceuticalForm: { contains: 'comprimido', mode: 'insensitive' },
    })
  })

  it('builds filter for similarHolder', () => {
    const result = buildWhere({ similarHolder: 'EMS' })
    expect(result).toEqual({
      similarHolder: { contains: 'EMS', mode: 'insensitive' },
    })
  })

  it('combines multiple filters', () => {
    const result = buildWhere({
      reference: '12345',
      category: 'Similar',
      status: 'Ativo',
    })
    expect(result).toEqual({
      reference: { contains: '12345', mode: 'insensitive' },
      category: { contains: 'Similar', mode: 'insensitive' },
      status: { contains: 'Ativo', mode: 'insensitive' },
    })
  })

  it('ignores undefined filters', () => {
    const result = buildWhere({ reference: '123', activeIngredient: undefined })
    expect(result).toEqual({
      reference: { contains: '123', mode: 'insensitive' },
    })
  })

  it('ignores empty string filters', () => {
    const result = buildWhere({ reference: '' })
    expect(result).toEqual({})
  })
})
