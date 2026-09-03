import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const prismaMock = {
  searchFeedback: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/actions/search-feedback', () => ({
  submitSearchFeedback: vi.fn(),
  getFeedbackStats: vi.fn(),
  getLowQualityQueries: vi.fn(),
}))

import { auth } from '@/auth'
import * as feedbackActions from '@/lib/actions/search-feedback'

// O `auth` exportado pelo NextAuth tem overloads de middleware; para mockar o
// retorno da sessão, tipamos explicitamente a forma que a rota consome.
const authMock = auth as unknown as () => Promise<{
  user: { email: string; name: string; role: string } | null
} | null>

const VALID_BODY = {
  query: 'dipirona',
  medicineId: 12,
  medicineName: 'Dipirona 500mg',
  feedback: 'helpful',
}

function post(body: unknown, headers: Record<string, string> = {}) {
  const req = new NextRequest('http://localhost/api/search-feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  return req
}

describe('POST /api/search-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(feedbackActions.submitSearchFeedback).mockResolvedValue({ success: true })
  })

  it('rejects oversized payloads (Content-Length > 8KB) with 413 before parsing (F5 guard)', async () => {
    const { POST } = await import('@/app/api/search-feedback/route')
    const req = post(VALID_BODY, { 'content-length': '9000' })
    const res = await POST(req)

    expect(res.status).toBe(413)
    expect(feedbackActions.submitSearchFeedback).not.toHaveBeenCalled()
  })

  it('accepts valid payloads and records feedback', async () => {
    const { POST } = await import('@/app/api/search-feedback/route')
    const res = await POST(post(VALID_BODY))

    expect(res.status).toBe(200)
    expect(feedbackActions.submitSearchFeedback).toHaveBeenCalledWith(VALID_BODY)
  })

  it('rejects invalid payloads with 400', async () => {
    const { POST } = await import('@/app/api/search-feedback/route')
    const res = await POST(post({ query: '', medicineId: 0, medicineName: '', feedback: 'x' }))

    expect(res.status).toBe(400)
    expect(feedbackActions.submitSearchFeedback).not.toHaveBeenCalled()
  })

  it('returns 500 with generic message when action throws', async () => {
    vi.mocked(feedbackActions.submitSearchFeedback).mockRejectedValue(new Error('boom'))

    const { POST } = await import('@/app/api/search-feedback/route')
    const res = await POST(post(VALID_BODY))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toBe('Erro interno do servidor')
  })
})

describe('GET /api/search-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(feedbackActions.getFeedbackStats).mockResolvedValue({
      helpful: 1,
      notHelpful: 2,
      total: 3,
    } as never)
    vi.mocked(feedbackActions.getLowQualityQueries).mockResolvedValue([] as never)
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(authMock).mockResolvedValue(null)

    const { GET } = await import('@/app/api/search-feedback/route')
    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('forbids non-admin authenticated requests with 403', async () => {
    vi.mocked(authMock).mockResolvedValue({ user: { email: 'user@example.com', name: 'User', role: 'USER' } })

    const { GET } = await import('@/app/api/search-feedback/route')
    const res = await GET()

    expect(res.status).toBe(403)
    expect(prismaMock.searchFeedback.findMany).not.toHaveBeenCalled()
  })

  it('allows admin and returns stats', async () => {
    vi.mocked(authMock).mockResolvedValue({ user: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN' } })

    const { GET } = await import('@/app/api/search-feedback/route')
    const res = await GET()

    expect(res.status).toBe(200)
    expect(feedbackActions.getFeedbackStats).toHaveBeenCalled()
  })
})