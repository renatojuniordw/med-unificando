import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/search-analytics
// Retorna estatísticas de busca para o dashboard admin
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Queries mais frequentes (últimos 30 dias)
    const topQueries = await prisma.$queryRawUnsafe<{ query: string; count: number; avg_score: number }[]>(
      `SELECT query, COUNT(*)::int as count, ROUND(AVG(top_score)::numeric, 3) as avg_score
       FROM search_logs
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY query
       ORDER BY count DESC
       LIMIT 20`
    )

    // Queries sem resultados
    const noResults = await prisma.$queryRawUnsafe<{ query: string; count: number }[]>(
      `SELECT query, COUNT(*)::int as count
       FROM search_logs
       WHERE results_count = 0 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY query
       ORDER BY count DESC
       LIMIT 20`
    )

    // Média de tempo de resposta
    const performance = await prisma.$queryRawUnsafe<{ avg_ms: number; p95_ms: number }[]>(
      `SELECT
         ROUND(AVG(response_time_ms)::numeric, 0) as avg_ms,
         ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms))::numeric, 0) as p95_ms
       FROM search_logs
       WHERE created_at > NOW() - INTERVAL '30 days'`
    )

    // Total de buscas nos últimos 7 dias
    const totalSearches = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int as count
       FROM search_logs
       WHERE created_at > NOW() - INTERVAL '7 days'`
    )

    // Queries por tipo
    const byType = await prisma.$queryRawUnsafe<{ query_type: string; count: number }[]>(
      `SELECT query_type, COUNT(*)::int as count
       FROM search_logs
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY query_type
       ORDER BY count DESC`
    )

    return NextResponse.json({
      topQueries,
      noResultsQueries: noResults,
      performance: performance[0] || { avg_ms: 0, p95_ms: 0 },
      totalSearchesLast7Days: totalSearches[0]?.count ?? 0,
      byType,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
