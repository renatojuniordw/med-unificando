import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.hoisted(() => vi.fn())

vi.mock('@/auth', () => ({
  auth: mockAuth,
}))

import { withAuth, withAuthReturn } from '@/lib/auth-guard'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('withAuth', () => {
  it('calls fn and returns result when session exists', async () => {
    mockAuth.mockResolvedValue({ user: { name: 'Admin' } })
    const fn = vi.fn().mockResolvedValue({ success: true, data: 'ok' })
    const result = await withAuth(fn)
    expect(fn).toHaveBeenCalledWith({ user: { name: 'Admin' } })
    expect(result).toEqual({ success: true, data: 'ok' })
  })

  it('returns UNAUTHORIZED when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const fn = vi.fn()
    const result = await withAuth(fn)
    expect(fn).not.toHaveBeenCalled()
    expect(result).toEqual({ success: false, error: 'Não autorizado' })
  })

  it('returns UNAUTHORIZED when session has no user', async () => {
    mockAuth.mockResolvedValue({ user: null })
    const fn = vi.fn()
    const result = await withAuth(fn)
    expect(fn).not.toHaveBeenCalled()
    expect(result).toEqual({ success: false, error: 'Não autorizado' })
  })
})

describe('withAuthReturn', () => {
  it('calls fn and returns result when session exists', async () => {
    mockAuth.mockResolvedValue({ user: { name: 'Admin' } })
    const fn = vi.fn().mockResolvedValue('data')
    const result = await withAuthReturn('default', fn)
    expect(fn).toHaveBeenCalledWith({ user: { name: 'Admin' } })
    expect(result).toBe('data')
  })

  it('returns defaultValue when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const fn = vi.fn()
    const result = await withAuthReturn('default', fn)
    expect(fn).not.toHaveBeenCalled()
    expect(result).toBe('default')
  })

  it('returns defaultValue when session has no user', async () => {
    mockAuth.mockResolvedValue({ user: undefined })
    const fn = vi.fn()
    const result = await withAuthReturn([], fn)
    expect(fn).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })
})
