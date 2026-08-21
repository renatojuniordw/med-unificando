import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/autocomplete?q=dip&limit=8
// Retorna sugestões de medicamentos usando trigram (via pg_trgm GIN index)
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '8', 10), 20)

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    // Busca por trigram no tradeName e activeIngredient
    // Usa o operador % que aproveita o GIN index existente
    const rows = await prisma.$queryRawUnsafe<{ tradeName: string; activeIngredient: string }[]>(
      `SELECT DISTINCT "tradeName", "activeIngredient"
       FROM medicines
       WHERE "tradeName" % $1
          OR "activeIngredient" % $1
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
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 500 })
  }
}
