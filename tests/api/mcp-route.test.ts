import { describe, it, expect, vi, beforeEach } from 'vitest'

const handleRequest = vi.fn()
const fakeTransport = { handleRequest }

vi.mock('@/lib/mcp/config', () => ({
  MCP_CONFIG: {
    ENABLED: true,
    ALLOWED_ORIGIN: 'https://med.unificando.com.br',
    ALLOWED_ORIGINS: [],
  },
}))

vi.mock('@/lib/mcp/security', () => ({
  checkMcpSecurity: vi.fn(() => ({ ok: true })),
}))

vi.mock('@/lib/mcp/session', () => ({
  mcpSessions: {
    get: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

import { checkMcpSecurity } from '@/lib/mcp/security'
import { mcpSessions } from '@/lib/mcp/session'

describe('route /api/mcp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkMcpSecurity).mockReturnValue({ ok: true })
    handleRequest.mockReset()
    handleRequest.mockResolvedValue(new Response('ok', { status: 200 }))
    vi.mocked(mcpSessions.create).mockResolvedValue(fakeTransport as never)
    vi.mocked(mcpSessions.get).mockImplementation((id: string) => (id === 'sess-1' ? fakeTransport : null) as never)
  })

  it('POST sem session id cria um transport novo e delega', async () => {
    const { POST } = await import('@/app/api/mcp/route')
    const res = await POST(new Request('http://localhost/api/mcp', { method: 'POST' }))
    expect(res.status).toBe(200)
    expect(mcpSessions.create).toHaveBeenCalledTimes(1)
    expect(handleRequest).toHaveBeenCalledTimes(1)
  })

  it('POST com session id reutiliza o transport da sessão', async () => {
    const { POST } = await import('@/app/api/mcp/route')
    await POST(new Request('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'mcp-session-id': 'sess-1' },
    }))
    expect(mcpSessions.get).toHaveBeenCalledWith('sess-1')
    expect(mcpSessions.create).not.toHaveBeenCalled()
    expect(handleRequest).toHaveBeenCalledTimes(1)
  })

  it('POST com session id inválido retorna 404', async () => {
    const { POST } = await import('@/app/api/mcp/route')
    const res = await POST(new Request('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'mcp-session-id': 'desconhecida' },
    }))
    expect(res.status).toBe(404)
    expect(handleRequest).not.toHaveBeenCalled()
  })

  it('GET e DELETE delegam ao transport da sessão', async () => {
    const { GET, DELETE } = await import('@/app/api/mcp/route')
    const getReq = new Request('http://localhost/api/mcp', { headers: { 'mcp-session-id': 'sess-1' } })
    const getRes = await GET(getReq)
    expect(getRes.status).toBe(200)

    const delRes = await DELETE(new Request('http://localhost/api/mcp', {
      method: 'DELETE',
      headers: { 'mcp-session-id': 'sess-1' },
    }))
    expect(delRes.status).toBe(200)
    expect(mcpSessions.delete).toHaveBeenCalledWith('sess-1')
  })

  it('responde 404 quando a sessão não existe em GET/DELETE', async () => {
    const { GET, DELETE } = await import('@/app/api/mcp/route')
    const req = new Request('http://localhost/api/mcp', { headers: { 'mcp-session-id': 'desconhecida' } })
    expect((await GET(req)).status).toBe(404)
    expect((await DELETE(req)).status).toBe(404)
  })

  it('propaga a resposta de segurança quando a validação falha', async () => {
    const forbidden = new Response('forbidden', { status: 403 })
    vi.mocked(checkMcpSecurity).mockReturnValue({ ok: false, response: forbidden })
    const { POST } = await import('@/app/api/mcp/route')
    const res = await POST(new Request('http://localhost/api/mcp', { method: 'POST' }))
    expect(res.status).toBe(403)
    expect(handleRequest).not.toHaveBeenCalled()
  })

  it('adiciona CORS à resposta quando a origem é permitida', async () => {
    const { POST } = await import('@/app/api/mcp/route')
    const res = await POST(new Request('http://localhost/api/mcp', {
      method: 'POST',
      headers: { origin: 'https://med.unificando.com.br' },
    }))
    expect(res.headers.get('access-control-allow-origin')).toBe('https://med.unificando.com.br')
    expect(res.headers.get('access-control-expose-headers')).toContain('mcp-session-id')
    expect(res.headers.get('vary')).toContain('Origin')
  })

  it('não adiciona CORS para origem fora da allowlist (sem origin)', async () => {
    const { POST } = await import('@/app/api/mcp/route')
    const res = await POST(new Request('http://localhost/api/mcp', { method: 'POST' }))
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('OPTIONS responde preflight CORS para origem permitida', async () => {
    const { OPTIONS } = await import('@/app/api/mcp/route')
    const res = await OPTIONS(new Request('http://localhost/api/mcp', {
      method: 'OPTIONS',
      headers: { origin: 'https://med.unificando.com.br' },
    }))
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://med.unificando.com.br')
    expect(res.headers.get('access-control-allow-methods')).toContain('POST')
    expect(res.headers.get('access-control-allow-headers')).toContain('mcp-session-id')
  })

  it('OPTIONS sem origin permitida responde 204 sem CORS', async () => {
    const { OPTIONS } = await import('@/app/api/mcp/route')
    const res = await OPTIONS(new Request('http://localhost/api/mcp', { method: 'OPTIONS' }))
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('retorna 404 com mensagem própria quando MCP está desabilitado', async () => {
    const { MCP_CONFIG } = await import('@/lib/mcp/config')
    ;(MCP_CONFIG as { ENABLED: boolean }).ENABLED = false
    const { POST } = await import('@/app/api/mcp/route')
    const res = await POST(new Request('http://localhost/api/mcp', { method: 'POST' }))
    expect(res.status).toBe(404)
    expect(JSON.parse(await res.text()).error).toContain('MCP_ENABLED')
    ;(MCP_CONFIG as { ENABLED: boolean }).ENABLED = true
  })
})