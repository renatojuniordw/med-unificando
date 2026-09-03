import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { submitSearchFeedback, getFeedbackStats, getLowQualityQueries } from '@/lib/actions/search-feedback'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(ip, 'search-feedback', { limit: 20 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  try {
    const body = await request.json()
    const { query, medicineId, medicineName, feedback } = body

    if (!query || typeof query !== 'string' || !feedback) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: query, feedback' },
        { status: 400 }
      )
    }

    const result = await submitSearchFeedback({
      query,
      medicineId,
      medicineName,
      feedback,
    })

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
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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