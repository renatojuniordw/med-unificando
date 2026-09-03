import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export function proxy(request: NextRequest) {
  if (request.method === 'POST' && request.nextUrl.pathname === '/admin/login') {
    const ip = getClientIp(request)
    const rl = rateLimit(ip, 'login', { limit: 10 })
    if (!rl.allowed) {
      return rateLimitResponse(rl, 'Muitas tentativas de login. Aguarde alguns minutos.')
    }
  }

  return NextResponse.next()
}

export const config = {
  // O POST de credenciais do NextAuth também é alvo de brute force; o gate de
  // verdade fica na route /api/auth/callback/credentials (rate-limit por IP),
  // este matcher é defesa em profundidade na borda.
  matcher: ['/admin/login', '/api/auth/callback/credentials'],
}