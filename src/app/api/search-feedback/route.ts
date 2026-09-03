import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { submitSearchFeedback, getFeedbackStats, getLowQualityQueries } from '@/lib/actions/search-feedback'
import { feedbackSchema } from '@/lib/feedback-schema'
import { isAdmin } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(ip, 'search-feedback', { limit: 20 })
  if (!rl.allowed) {
    return rateLimitResponse(rl)
  }

  try {
    const body = await request.json()
    const parsed = feedbackSchema.safeParse(body)

    if (!parsed.success) {
      const detail = parsed.error.issues.map(i => i.message).join('; ')
      return NextResponse.json(
        { error: `Dados inválidos: ${detail}` },
        { status: 400 }
      )
    }

    const result = await submitSearchFeedback(parsed.data)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Feedback registrado com sucesso. Obrigado por contribuir para melhorar a busca!',
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Erro ao salvar feedback' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao processar feedback:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })
  }

  try {
    const stats = await getFeedbackStats()
    const lowQuality = await getLowQualityQueries()

    return NextResponse.json({
      ...stats,
      lowQuality,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}