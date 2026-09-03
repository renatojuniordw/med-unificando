import { describe, it, expect } from 'vitest'
import { ANVISA, SEARCH } from '@/lib/config'

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

describe('SEARCH config', () => {
  it('centralizes cache and model tuning keys', () => {
    expect(SEARCH.CACHE_TTL_MS).toBe(5 * 60 * 1000)
    expect(SEARCH.CACHE_MAX_ENTRIES).toBe(500)
    expect(SEARCH.MODEL_CACHE_DIR).toBe('/tmp/.transformers-cache')
    expect(SEARCH.IVFFLAT_PROBES).toBe(40)
    expect(SEARCH.PGVECTOR_TIMEOUT_MS).toBe(30_000)
    expect(SEARCH.TSQUERY_LANGUAGE).toBe('portuguese')
    expect(SEARCH.NAME_QUERY_MIN_CONFIDENCE).toBe(0.6)
  })

  it('centralizes standard quantities', () => {
    expect(SEARCH.HYBRID_TOP_K).toBe(20)
    expect(SEARCH.SOURCE_FETCH_MULTIPLIER).toBe(5)
    expect(SEARCH.FINAL_CUT_MARGIN).toBe(2)
    expect(SEARCH.AUTOCOMPLETE_TAKE).toBe(8)
    expect(SEARCH.DASHBOARD_TOP_K).toBe(10)
  })

  it('does not expose removed dead keys', () => {
    expect(SEARCH).not.toHaveProperty('PAGE_SIZE')
    expect(SEARCH).not.toHaveProperty('TRIGRAM_MIN_THRESHOLD')
    expect(SEARCH).not.toHaveProperty('TRIGRAM_MIN_THRESHOLD_NAME')
  })
})
