import { NextResponse } from 'next/server'

// Rate limiter simples em memória (janela fixa por IP).
// Adequado para instância única; para multi-instância, migrar para Redis.

const WINDOW_MS = 60_000

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  limit: number
  windowMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

function getKey(ip: string, scope: string): string {
  return `${scope}:${ip}`
}

export function rateLimit(ip: string, scope: string, options: RateLimitOptions): RateLimitResult {
  const windowMs = options.windowMs ?? WINDOW_MS
  const now = Date.now()
  const key = getKey(ip, scope)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 }
  }

  bucket.count += 1
  if (bucket.count > options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  return { allowed: true, remaining: options.limit - bucket.count, retryAfterSeconds: 0 }
}

// Obtém o IP do cliente a partir dos headers de proxy.
// ATENÇÃO (M9): confia em X-Forwarded-For — seguro quando o tráfego passa por
// um proxy confiável (Vercel, nginx/traefik no VPS) que sobrescreve o header.
// Se o cliente alcançar a origem diretamente (proxy ausente/não confiável),
// o header é forjável e o rate limit pode ser contornado. Nesse cenário,
// configurar fail2ban/limitadores de rede na borda (não apenas aqui).
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  )
}

// Resposta HTTP 429 padronizada para rate limiting (com Retry-After).
export function rateLimitResponse(
  rl: RateLimitResult,
  message: string = 'Muitas requisições. Tente novamente em alguns instantes.'
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
  )
}