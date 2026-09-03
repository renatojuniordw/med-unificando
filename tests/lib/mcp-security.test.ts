import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'

vi.mock('@/lib/rate-limit', () => ({
  getClientIp: vi.fn(() => '203.0.113.10'),
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 100, retryAfterSeconds: 0 })),
  rateLimitResponse: vi.fn(() => new Response(JSON.stringify({ error: 'rate limit' }), { status: 429 })),
}))

type SecurityModule = typeof import('@/lib/mcp/security')

async function loadSecurity(env: Record<string, string | undefined>): Promise<SecurityModule> {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.resetModules()
  return import('@/lib/mcp/security')
}

describe('checkMcpSecurity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.MCP_API_KEY
    delete process.env.MCP_ALLOWED_ORIGINS
    delete process.env.BASE_URL
  })

  it('permite request sem Origin (clientes nativos não enviam)', async () => {
    const { checkMcpSecurity } = await loadSecurity({ MCP_API_KEY: undefined })
    expect(checkMcpSecurity(new Request('https://example.com/api/mcp'))).toEqual({ ok: true })
  })

  it('bloqueia Origin fora da allowlist (DNS rebinding)', async () => {
    const { checkMcpSecurity } = await loadSecurity({ MCP_API_KEY: undefined })
    const result = checkMcpSecurity(new Request('https://example.com/api/mcp', {
      headers: { origin: 'https://evil.example' },
    }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('permite Origin igual ao BASE_URL', async () => {
    const { checkMcpSecurity } = await loadSecurity({ MCP_API_KEY: undefined, BASE_URL: 'https://med.unificando.com.br' })
    expect(checkMcpSecurity(new Request('https://example.com/api/mcp', {
      headers: { origin: 'https://med.unificando.com.br' },
    })).ok).toBe(true)
  })

  it('permite Origins extras de MCP_ALLOWED_ORIGINS', async () => {
    const { checkMcpSecurity } = await loadSecurity({ MCP_API_KEY: undefined, MCP_ALLOWED_ORIGINS: 'https://app.example.com, https://tools.example.org' })
    expect(checkMcpSecurity(new Request('https://example.com/api/mcp', {
      headers: { origin: 'https://app.example.com' },
    })).ok).toBe(true)
    expect(checkMcpSecurity(new Request('https://example.com/api/mcp', {
      headers: { origin: 'https://tools.example.org' },
    })).ok).toBe(true)
  })

  it('exige Bearer quando MCP_API_KEY está configurada', async () => {
    const { checkMcpSecurity } = await loadSecurity({ MCP_API_KEY: 'segredo-teste' })

    const semAuth = checkMcpSecurity(new Request('https://example.com/api/mcp'))
    expect(semAuth.ok).toBe(false)
    if (!semAuth.ok) expect(semAuth.response.status).toBe(401)

    const authErrada = checkMcpSecurity(new Request('https://example.com/api/mcp', {
      headers: { authorization: 'Bearer errada' },
    }))
    expect(authErrada.ok).toBe(false)

    const authOk = checkMcpSecurity(new Request('https://example.com/api/mcp', {
      headers: { authorization: 'Bearer segredo-teste' },
    }))
    expect(authOk).toEqual({ ok: true })
  })

  it('retorna 429 quando o rate limit nega', async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false, remaining: 0, retryAfterSeconds: 30 })
    const { checkMcpSecurity } = await loadSecurity({ MCP_API_KEY: undefined })
    const result = checkMcpSecurity(new Request('https://example.com/api/mcp'))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(429)
      expect(rateLimitResponse).toHaveBeenCalled()
    }
  })

  it('usa o IP do cliente no rate limit com escopo mcp', async () => {
    const { checkMcpSecurity } = await loadSecurity({ MCP_API_KEY: undefined })
    checkMcpSecurity(new Request('https://example.com/api/mcp'))
    expect(getClientIp).toHaveBeenCalled()
    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 'mcp', { limit: 120 })
  })
})