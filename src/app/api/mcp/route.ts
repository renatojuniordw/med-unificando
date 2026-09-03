import { MCP_CONFIG } from '@/lib/mcp/config'
import { checkMcpSecurity } from '@/lib/mcp/security'
import { mcpSessions } from '@/lib/mcp/session'
import { NextResponse } from 'next/server'
import type { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SESSION_NOT_FOUND = NextResponse.json(
  { error: 'Sessão não encontrada. Inicialize uma nova sessão.' },
  { status: 404 }
)

const MCP_DISABLED = NextResponse.json(
  { error: 'MCP desabilitado (MCP_ENABLED=false).' },
  { status: 404 }
)

const ALLOWED_METHODS = 'GET, POST, DELETE, OPTIONS'
const ALLOWED_HEADERS = 'content-type, authorization, accept, mcp-session-id, mcp-protocol-version'

const ORIGIN_ALLOWLIST = [MCP_CONFIG.ALLOWED_ORIGIN, ...MCP_CONFIG.ALLOWED_ORIGINS]

/** Origin permitido da requisição, ou null quando não aplicável (clientes nativos). */
function corsOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  return ORIGIN_ALLOWLIST.includes(origin) ? origin : null
}

/**
 * Adiciona CORS a uma resposta quando a origem está na allowlist.
 *
 * O transporte MCP não emite `Access-Control-Allow-Origin`; sem esses headers
 * o navegador bloqueia a leitura mesmo com a origem validada (DNS rebinding).
 * A regra de negócio da allowlist continua em `security.ts` (403 se fora).
 */
function withCors(response: Response, origin: string | null): Response {
  if (!origin) return response
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Expose-Headers', 'mcp-session-id')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Endpoint MCP (Streamable HTTP) — GET, POST e DELETE.
 *
 * Adaptador fino: valida segurança, resolve a sessão, delega ao transporte MCP
 * (`WebStandardStreamableHTTPServerTransport.handleRequest`) e aplica CORS.
 *
 * Handshake (spec 2025-06-18):
 * 1. `POST /api/mcp` com InitializeRequest (Accept: application/json, text/event-stream)
 *    → resposta com header `Mcp-Session-Id`
 * 2. `POST` notifications/initialized (retorna 202)
 * 3. `POST` tools/list, tools/call, ...
 *
 * GET abre um stream SSE por sessão (para notificações do servidor).
 */
function handleWithTransport(
  request: Request,
  transport: WebStandardStreamableHTTPServerTransport
): Promise<Response> {
  return Promise.resolve(transport.handleRequest(request)).then((response) =>
    withCors(response, corsOrigin(request))
  )
}

export async function GET(request: Request) {
  if (!MCP_CONFIG.ENABLED) return MCP_DISABLED

  const guard = checkMcpSecurity(request)
  if (!guard.ok) return guard.response

  const sessionId = request.headers.get('mcp-session-id')
  const transport = sessionId ? mcpSessions.get(sessionId) : null
  if (!transport) return SESSION_NOT_FOUND

  return handleWithTransport(request, transport)
}

export async function POST(request: Request) {
  if (!MCP_CONFIG.ENABLED) return MCP_DISABLED

  const guard = checkMcpSecurity(request)
  if (!guard.ok) return guard.response

  const sessionId = request.headers.get('mcp-session-id')
  if (sessionId) {
    const transport = mcpSessions.get(sessionId)
    if (!transport) return SESSION_NOT_FOUND
    return handleWithTransport(request, transport)
  }

  // Sem session header (ex.: InitializeRequest): cria transport + server novos.
  // A sessão é registrada pelo callback `onsessioninitialized` do transporte.
  const transport = await mcpSessions.create()
  return handleWithTransport(request, transport)
}

export async function DELETE(request: Request) {
  if (!MCP_CONFIG.ENABLED) return MCP_DISABLED

  const guard = checkMcpSecurity(request)
  if (!guard.ok) return guard.response

  const sessionId = request.headers.get('mcp-session-id')
  const transport = sessionId ? mcpSessions.get(sessionId) : null
  if (!transport) return SESSION_NOT_FOUND

  const response = await handleWithTransport(request, transport)
  // O transporte fecha a sessão; por segurança, remove do map também (e fecha
  // o server do protocolo via session.remove).
  mcpSessions.delete(sessionId!)
  return response
}

/** Preflight CORS para navegadores com origem na allowlist. */
export function OPTIONS(request: Request) {
  const origin = corsOrigin(request)
  if (!origin) return new Response(null, { status: 204 })
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': ALLOWED_METHODS,
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  })
}