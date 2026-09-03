import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export function proxy(request: NextRequest) {
  if (request.method === 'POST' && request.nextUrl.pathname === '/admin/login') {
    const ip = getClientIp(request)
    const rl = rateLimit(ip, 'login', { limit: 10 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Aguarde alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/login'],
}