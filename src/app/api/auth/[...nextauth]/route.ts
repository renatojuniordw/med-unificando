import { NextRequest } from 'next/server'
import { handlers } from '@/auth'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// Rate limit específico do fluxo de autenticação (brute force de credenciais).
// O NextAuth envia as credenciais para POST /api/auth/callback/credentials — esse
// path é o ponto único de verificação de senha, então é onde o limite realmente importa
// (o /admin/login em src/proxy.ts era insuficiente: nunca recebia o POST do signIn).
const LOGIN_LIMIT = 10

export const GET = handlers.GET

export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/auth/callback/credentials') {
    const ip = getClientIp(request)
    const rl = rateLimit(ip, 'login', { limit: LOGIN_LIMIT })
    if (!rl.allowed) {
      return rateLimitResponse(rl, 'Muitas tentativas de login. Aguarde alguns minutos.')
    }
  }

  return handlers.POST(request)
}