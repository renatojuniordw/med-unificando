import { headers } from 'next/headers'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const RATE_LIMIT_ERROR = 'Muitas requisições. Tente novamente em instantes.'

export interface ActionRateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

// Rate limit para server actions públicas: o limiter das rotas /api não cobre
// actions invocadas diretamente pelo client (busca, autocomplete, export, feedback).
// Reutiliza a mesma janela fixa por IP do limiter das rotas — mesma nota sobre
// X-Forwarded-For (seguro atrás de proxy confiável, ver src/lib/rate-limit.ts).
//
// Best-effort: se o runtime não expõe os headers da requisição (ex.: execução em
// testes/CLI fora de uma requisição HTTP), o limite é ignorado em vez de quebrar a
// chamada. Em produção, dentro de server actions, headers() está sempre disponível.
export async function checkActionRateLimit(
  scope: string,
  limit: number
): Promise<ActionRateLimitResult> {
  try {
    const requestHeaders = await headers()
    const ip = getClientIp({ headers: requestHeaders } as unknown as Request)
    const rl = rateLimit(ip, scope, { limit })
    return { allowed: rl.allowed, retryAfterSeconds: rl.retryAfterSeconds }
  } catch {
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

// Para actions que retornam dados: lança erro no limite, tratado pelo catch do client.
export async function assertActionRateLimit(scope: string, limit: number): Promise<void> {
  const { allowed } = await checkActionRateLimit(scope, limit)
  if (!allowed) {
    throw new Error(RATE_LIMIT_ERROR)
  }
}