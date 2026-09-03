import { SITE } from '@/lib/config'

const DEFAULT_SESSION_TTL_MIN = 60
const DEFAULT_RATE_LIMIT = 120

function parsePositiveIntMinutes(value: string | undefined, fallback: number): number {
  const parsed = value ? Number.parseInt(value, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Configuração central do MCP Server (espelha o padrão de `src/lib/config.ts`).
 *
 * Variáveis:
 * - `MCP_ENABLED` — desliga a rota /api/mcp (retorna 404)
 * - `MCP_API_KEY` — se preenchida, exige `Authorization: Bearer <key>` em todo request
 * - `MCP_ALLOWED_ORIGINS` — allowlist extra de Origin (vírgula); default: BASE_URL
 * - `MCP_SESSION_TTL_MIN` — TTL de sessão em minutos (sliding)
 * - `MCP_ENABLE_JSON_RESPONSE` — true = respostas JSON puras (sem SSE)
 */
export const MCP_CONFIG = {
  ENABLED: (process.env.MCP_ENABLED ?? 'true') !== 'false',
  API_KEY: process.env.MCP_API_KEY ?? '',
  ALLOWED_ORIGINS: (process.env.MCP_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  SESSION_TTL_MS: parsePositiveIntMinutes(process.env.MCP_SESSION_TTL_MIN, DEFAULT_SESSION_TTL_MIN) * 60_000,
  ENABLE_JSON_RESPONSE: (process.env.MCP_ENABLE_JSON_RESPONSE ?? 'false') === 'true',
  RATE_LIMIT: parsePositiveIntMinutes(process.env.MCP_RATE_LIMIT, DEFAULT_RATE_LIMIT),
  ALLOWED_ORIGIN: (() => {
    try {
      return new URL(SITE.BASE_URL).origin
    } catch {
      return SITE.BASE_URL
    }
  })(),
} as const