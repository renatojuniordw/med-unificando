import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Fake transport registra as opções para permitir disparar os callbacks
// de sessão (onsessioninitialized / onsessionclosed) manualmente e verificar
// que a remoção de sessão fecha o transporte (anti-leak de SSE).
const fakeInstances: { opts: Record<string, unknown>; close: ReturnType<typeof vi.fn> }[] = []

vi.mock('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js', () => {
  class FakeTransport {
    opts: Record<string, unknown>
    close: ReturnType<typeof vi.fn>
    constructor(opts: Record<string, unknown>) {
      this.opts = opts
      this.close = vi.fn().mockResolvedValue(undefined)
      fakeInstances.push(this)
    }
    async start() {}
  }
  return { WebStandardStreamableHTTPServerTransport: FakeTransport }
})

vi.mock('@/lib/mcp/server', () => ({
  createMcpServer: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  MCP_SERVER_NAME: 'med-unificando',
  MCP_SERVER_VERSION: '0.1.0',
}))

describe('McpSessionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    process.env.MCP_SESSION_TTL_MIN = '1'
    fakeInstances.length = 0
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.MCP_SESSION_TTL_MIN
  })

  it('create() retorna um transport conectado; sessão só existe após initialize', async () => {
    const { mcpSessions } = await import('@/lib/mcp/session')
    const client = await mcpSessions.create()

    // Antes do initialize, nenhuma sessão registrada
    expect(mcpSessions.size()).toBe(0)

    // Simula o callback disparado pelo transporte ao processar o InitializeRequest
    ;(client as unknown as { opts: { onsessioninitialized?: (id: string) => void } }).opts.onsessioninitialized?.('sess-1')
    expect(mcpSessions.size()).toBe(1)
    expect(mcpSessions.get('sess-1')).toBe(client)
  })

  it('get() de sessão inexistente/expirada retorna null e remove', async () => {
    const { mcpSessions } = await import('@/lib/mcp/session')
    const client = await mcpSessions.create()
    ;(client as unknown as { opts: { onsessioninitialized?: (id: string) => void } }).opts.onsessioninitialized?.('sess-1')

    expect(mcpSessions.get('nope')).toBeNull()

    // TTL de 1 min expira — get() passa a retornar null e o map é podado
    vi.advanceTimersByTime(60_001)
    expect(mcpSessions.get('sess-1')).toBeNull()
    expect(mcpSessions.size()).toBe(0)

    // Sessão removida fecha o transporte (não vaza SSE streams/sockets)
    const instance = fakeInstances.find((fake) => fake.opts.onsessioninitialized)
    expect(instance?.close).toHaveBeenCalled()
  })

  it('get() renova o TTL (sliding window)', async () => {
    const { mcpSessions } = await import('@/lib/mcp/session')
    const client = await mcpSessions.create()
    ;(client as unknown as { opts: { onsessioninitialized?: (id: string) => void } }).opts.onsessioninitialized?.('sess-1')

    // Acessa no meio da janela: renova para +60s a partir daqui
    vi.advanceTimersByTime(30_000)
    expect(mcpSessions.get('sess-1')).toBe(client)

    // 30s depois (60s total desde a criação, mas 30s desde o refresh) → ainda válida
    vi.advanceTimersByTime(30_000)
    expect(mcpSessions.get('sess-1')).toBe(client)
  })

  it('onsessionclosed remove a sessão (DELETE do cliente)', async () => {
    const { mcpSessions } = await import('@/lib/mcp/session')
    const client = await mcpSessions.create()
    ;(client as unknown as { opts: { onsessioninitialized?: (id: string) => void } }).opts.onsessioninitialized?.('sess-1')
    ;(client as unknown as { opts: { onsessionclosed?: (id: string) => void } }).opts.onsessionclosed?.('sess-1')

    expect(mcpSessions.get('sess-1')).toBeNull()
    expect(mcpSessions.size()).toBe(0)
  })

  it('delete() remove explicitamente e fecha o transporte', async () => {
    const { mcpSessions } = await import('@/lib/mcp/session')
    const client = await mcpSessions.create()
    ;(client as unknown as { opts: { onsessioninitialized?: (id: string) => void } }).opts.onsessioninitialized?.('sess-1')

    mcpSessions.delete('sess-1')
    expect(mcpSessions.size()).toBe(0)

    const instance = fakeInstances.find((fake) => fake.opts.onsessioninitialized)
    expect(instance?.close).toHaveBeenCalled()
  })
})