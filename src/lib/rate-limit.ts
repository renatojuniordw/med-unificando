// Rate limiter simples em memória (janela deslizante por IP).
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

function getKey(ip: string, scope: string): string {
  return `${scope}:${ip}`
}

export function rateLimit(ip: string, scope: string, options: RateLimitOptions): {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
} {
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

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  )
}