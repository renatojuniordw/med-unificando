import { randomUUID } from 'node:crypto'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { MCP_CONFIG } from './config'
import { createMcpServer } from './server'

interface McpSession {
  transport: WebStandardStreamableHTTPServerTransport
  server: McpServer
  expiresAt: number
}

// Tetos e janelas de sweep — mesmo padrão do rate-limit em memória
// (`src/lib/rate-limit.ts`): adequado a deploy single-instance (Docker/VPS),
// conforme premissa já documentada no projeto.
const MAX_SESSIONS = 10_000
const SWEEP_INTERVAL_MS = 60_000

/**
 * Gerenciador de sessões MCP em memória.
 *
 * O SDK exige UMA instância de transporte (e de `McpServer` conectado) por
 * sessão, pois o transporte guarda o estado de inicialização e o session ID.
 * Os clientes reconectam sozinhos ao receber 404 (spec 2025-06-18), então
 * sessões expiradas/sessões perdidas não quebram o consumo.
 *
 * Responsabilidade única: criar, localizar e podar sessões.
 */
class McpSessionManager {
  private sessions = new Map<string, McpSession>()
  private lastSweepAt = 0

  /**
   * Cria transport + server conectados para uma nova sessão.
   * A sessão só é registrada quando o cliente envia `initialize`
   * (callback `onsessioninitialized` do transporte).
   */
  async create(): Promise<WebStandardStreamableHTTPServerTransport> {
    this.sweep(Date.now())

    const server = createMcpServer()
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: MCP_CONFIG.ENABLE_JSON_RESPONSE,
      onsessioninitialized: (sessionId) => {
        this.sessions.set(sessionId, {
          transport,
          server,
          expiresAt: Date.now() + MCP_CONFIG.SESSION_TTL_MS,
        })
      },
      onsessionclosed: (sessionId) => {
        this.remove(sessionId)
      },
    })

    await server.connect(transport)
    return transport
  }

  /** Recupera o transport de uma sessão (renova TTL — sliding window). */
  get(sessionId: string): WebStandardStreamableHTTPServerTransport | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    if (Date.now() > session.expiresAt) {
      this.remove(sessionId)
      return null
    }

    session.expiresAt = Date.now() + MCP_CONFIG.SESSION_TTL_MS
    return session.transport
  }

  /** Remove uma sessão explicitamente (ex.: DELETE do cliente). */
  delete(sessionId: string): void {
    this.remove(sessionId)
  }

  size(): number {
    return this.sessions.size
  }

  /**
   * Remove a sessão do map e fecha transport + server.
   *
   * Fechar explicitamente evita vazar `ReadableStream`/sockets de GET SSE que
   * continuam abertos após expiração/evicção — o mapa some (POSTs voltam 404 e
   * o cliente reinicializa), mas o stream órfão ficaria vivo sem isso.
   */
  private remove(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    this.sessions.delete(sessionId)
    void this.closeSession(session)
  }

  private async closeSession(session: McpSession): Promise<void> {
    try {
      await session.transport.close()
    } catch (error) {
      console.warn('[mcp] erro ao fechar transporte da sessão:', error)
    }
    try {
      await session.server.close()
    } catch (error) {
      console.warn('[mcp] erro ao fechar server da sessão:', error)
    }
  }

  private sweep(now: number): void {
    if (now - this.lastSweepAt < SWEEP_INTERVAL_MS && this.sessions.size <= MAX_SESSIONS) return
    this.lastSweepAt = now

    if (this.sessions.size > MAX_SESSIONS) {
      // Evicta as mais antigas (Map preserva ordem de inserção).
      for (const key of this.sessions.keys()) {
        if (this.sessions.size <= MAX_SESSIONS - 1) break
        this.remove(key)
      }
      return
    }

    for (const [key, session] of this.sessions) {
      if (session.expiresAt <= now) this.remove(key)
    }
  }
}

// Singleton de processo — mesmo padrão de `src/lib/prisma.ts` e do rate-limit.
export const mcpSessions = new McpSessionManager()