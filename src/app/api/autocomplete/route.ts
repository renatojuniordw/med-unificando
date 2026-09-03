import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// GET /api/autocomplete?q=dip&limit=8
// Retorna sugestões de medicamentos usando trigram (via pg_trgm GIN index)
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(ip, 'autocomplete', { limit: 120 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '8', 10), 20)

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    // Busca por trigram no tradeName e activeIngredient
    // Usa o operador % que aproveita o GIN index existente
    // GROUP BY (em vez de SELECT DISTINCT): com DISTINCT o Postgres exige que
    // toda expressão do ORDER BY esteja na lista de seleção, o que quebraria
    // o GREATEST(similarity(...)) abaixo.
    const rows = await prisma.$queryRawUnsafe<{ tradeName: string; activeIngredient: string }[]>(
      `SELECT "tradeName", "activeIngredient"
       FROM medicines
       WHERE "tradeName" % $1
          OR "activeIngredient" % $1
       GROUP BY "tradeName", "activeIngredient"
       ORDER BY
         GREATEST(
           similarity("tradeName", $1),
           similarity("activeIngredient", $1)
         ) DESC
       LIMIT $2`,
      q,
      limit,
    )

    // Formatar sugestões: priorizar tradeName, fallback para activeIngredient
    const suggestions = rows.map(r => ({
      label: r.tradeName || r.activeIngredient,
      sublabel: r.tradeName ? r.activeIngredient : null,
    }))

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[autocomplete] falha na busca trigram:', error)
    return NextResponse.json({ suggestions: [] }, { status: 500 })
  }
}
