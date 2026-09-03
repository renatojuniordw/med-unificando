import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request and reports remaining as limit - 1', () => {
    const rl = rateLimit('1.1.1.1', 'rl-p1', { limit: 5 })
    expect(rl.allowed).toBe(true)
    expect(rl.remaining).toBe(4)
    expect(rl.retryAfterSeconds).toBe(0)
  })

  it('allows requests up to the limit with decreasing remaining', () => {
    const scope = 'rl-p2'
    expect(rateLimit('1.1.1.1', scope, { limit: 2 })).toMatchObject({ allowed: true, remaining: 1 })
    expect(rateLimit('1.1.1.1', scope, { limit: 2 })).toMatchObject({ allowed: true, remaining: 0 })
  })

  it('blocks requests above the limit with retryAfterSeconds >= 1', () => {
    const scope = 'rl-p3'
    rateLimit('1.1.1.1', scope, { limit: 1 })
    const blocked = rateLimit('1.1.1.1', scope, { limit: 1 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1)
  })

  it('resets the bucket after the window expires', () => {
    vi.useFakeTimers()
    const scope = 'rl-p4'
    rateLimit('1.1.1.1', scope, { limit: 1, windowMs: 60_000 })
    expect(rateLimit('1.1.1.1', scope, { limit: 1, windowMs: 60_000 }).allowed).toBe(false)

    vi.advanceTimersByTime(60_001)
    const after = rateLimit('1.1.1.1', scope, { limit: 1, windowMs: 60_000 })
    expect(after.allowed).toBe(true)
    expect(after.remaining).toBe(0)
  })

  it('keeps buckets isolated by scope for the same IP', () => {
    rateLimit('1.1.1.1', 'rl-p5a', { limit: 1 })
    const other = rateLimit('1.1.1.1', 'rl-p5b', { limit: 1 })
    expect(other.allowed).toBe(true)
  })
})

describe('getClientIp', () => {
  it('returns the first x-forwarded-for value trimmed', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8' },
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost', { headers: { 'x-real-ip': '9.9.9.9' } })
    expect(getClientIp(req)).toBe('9.9.9.9')
  })

  it('returns unknown when no proxy headers exist', () => {
    expect(getClientIp(new Request('http://localhost'))).toBe('unknown')
  })
})

describe('rateLimitResponse', () => {
  it('returns 429 JSON with the Retry-After header', () => {
    const res = rateLimitResponse({ allowed: false, remaining: 0, retryAfterSeconds: 30 })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
  })

  it('uses the provided message in the body', async () => {
    const res = rateLimitResponse({ allowed: false, remaining: 0, retryAfterSeconds: 5 }, 'Limite atingido')
    const body = await res.json()
    expect(body.error).toBe('Limite atingido')
  })
})