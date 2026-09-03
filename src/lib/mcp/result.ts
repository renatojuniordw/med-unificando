import { RATE_LIMIT_ERROR } from '@/lib/rate-limit-action'
import type { McpToolResult } from './types'

// Mensagem genérica: nunca vazar detalhes internos (mesma política das rotas
// /api — o erro do Prisma não chega ao cliente, apenas ao log do servidor).
const GENERIC_ERROR_MESSAGE = 'Erro interno ao executar a ferramenta'

// Exceção: rate limit das server actions é um sinal de cliente legítimo
// (mesmo bucket de 120/min usado pelo site), não um erro interno — merece
// mensagem própria em vez de "erro interno" enganoso.
const RATE_LIMIT_MESSAGE = 'Muitas requisições. Tente novamente em instantes.'

/** Serializa dados em um content block de texto (resultado padrão de tool). */
export function jsonResult(data: unknown): McpToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  }
}

/** Transforma qualquer erro inesperado em um resultado MCP seguro. */
export function toolError(error: unknown): McpToolResult {
  if (error instanceof Error && error.message === RATE_LIMIT_ERROR) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: RATE_LIMIT_MESSAGE }) }],
    }
  }
  console.error('[mcp] erro na tool:', error)
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: GENERIC_ERROR_MESSAGE }) }],
  }
}