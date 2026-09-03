import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { headers } from 'next/headers'
import {
  checkActionRateLimit,
  assertActionRateLimit,
  RATE_LIMIT_ERROR,
} from '@/lib/rate-limit-action'

const mockedHeaders = vi.mocked(headers)

describe('checkActionRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates to the ip-based limiter and reports allowed/retryAfterSeconds', async () => {
    mockedHeaders.mockResolvedValue(new Headers({ 'x-forwarded-for': '10.0.0.1' }) as never)

    const first = await checkActionRateLimit('act-p1', 1)
    expect(first.allowed).toBe(true)

    const second = await checkActionRateLimit('act-p1', 1)
    expect(second.allowed).toBe(false)
    expect(second.retryAfterSeconds).toBeGreaterThanOrEqual(1)
  })

  it('is best-effort: allows when headers() is unavailable (non-HTTP context)', async () => {
    mockedHeaders.mockRejectedValue(new Error('headers called outside request scope') as never)

    const result = await checkActionRateLimit('act-p2', 1)
    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 })
  })
})

describe('assertActionRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves when the request is allowed', async () => {
    mockedHeaders.mockResolvedValue(new Headers() as never)
    await expect(assertActionRateLimit('act-p3', 5)).resolves.toBeUndefined()
  })

  it('throws RATE_LIMIT_ERROR when the request is blocked', async () => {
    mockedHeaders.mockResolvedValue(new Headers({ 'x-forwarded-for': '10.0.0.2' }) as never)
    await assertActionRateLimit('act-p4', 1)
    await expect(assertActionRateLimit('act-p4', 1)).rejects.toThrow(RATE_LIMIT_ERROR)
  })
})