import { createHash, timingSafeEqual } from 'node:crypto'
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { MCP_CONFIG } from './config'

export type McpSecurityResult =
  | { ok: true }
  | { ok: false; response: Response }

const ORIGIN_FORBIDDEN = { error: 'Origem não permitida' }
const UNAUTHORIZED = { error: 'Não autorizado' }

const EXPECTED_PREFIX = 'Bearer '

/**
 * Compara credenciais em tempo constante (mesmo tamanho via SHA-256), evitando
 * vazamento por timing quando `MCP_API_KEY` está ativa.
 */
function constantTimeEqual(value: string, expected: string): boolean {
  const hash = (input: string) => createHash('sha256').update(input, 'utf8').digest()
  return timingSafeEqual(hash(value), hash(expected))
}

/**
 * Validações de segurança do endpoint MCP, executadas antes do transporte:
 *
 * 1. **Origin (DNS rebinding)** — exigência do spec Streamable HTTP. Clientes
 *    nativos (Claude Desktop, Cursor, opencode) não enviam Origin; navegadores
 *    enviam. Origin presente precisa estar na allowlist (BASE_URL + extras).
 * 2. **API Key opcional** — se `MCP_API_KEY` estiver definida, exige
 *    `Authorization: Bearer <key>` em todas as requisições (comparação
 *    constant-time).
 * 3. **Rate limit por IP** — reusa o limiter das rotas /api (escopo `mcp`).
 */
export function checkMcpSecurity(request: Request): McpSecurityResult {
  const origin = request.headers.get('origin')
  if (origin) {
    const allowedOrigins = [MCP_CONFIG.ALLOWED_ORIGIN, ...MCP_CONFIG.ALLOWED_ORIGINS]
    if (!allowedOrigins.includes(origin)) {
      return { ok: false, response: Response.json(ORIGIN_FORBIDDEN, { status: 403 }) }
    }
  }

  if (MCP_CONFIG.API_KEY) {
    const auth = request.headers.get('authorization') ?? ''
    if (!auth.startsWith(EXPECTED_PREFIX) || !constantTimeEqual(auth.slice(EXPECTED_PREFIX.length), MCP_CONFIG.API_KEY)) {
      return { ok: false, response: Response.json(UNAUTHORIZED, { status: 401 }) }
    }
  }

  const rl = rateLimit(getClientIp(request), 'mcp', { limit: MCP_CONFIG.RATE_LIMIT })
  if (!rl.allowed) {
    return { ok: false, response: rateLimitResponse(rl) }
  }

  return { ok: true }
}