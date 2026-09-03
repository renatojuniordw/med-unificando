import { describe, it, expect } from 'vitest'
import { parseCsvToRows } from '@/lib/csv-utils'

describe('parseCsvToRows', () => {
  it('parses a CSV with header into keyed rows using empty-string default', () => {
    const rows = parseCsvToRows('nome,valor\na,1\nb,')
    expect(rows).toEqual([
      { nome: 'a', valor: '1' },
      { nome: 'b', valor: '' },
    ])
  })

  it('strips control characters before parsing', () => {
    const rows = parseCsvToRows('campo\x00um\x07,\x1fsegundo\nok, fim')
    expect(rows[0]).toHaveProperty('campoum')
    expect(rows[0]).toEqual(expect.objectContaining({ campoum: expect.any(String) }))
  })

  it('returns an empty array for a header-only CSV', () => {
    expect(parseCsvToRows('a,b\n')).toEqual([])
  })

  it('honours quoted values containing commas', () => {
    const rows = parseCsvToRows('nome\n"Vale, vírgula"')
    expect(rows).toEqual([{ nome: 'Vale, vírgula' }])
  })
})