import { prisma } from '@/lib/prisma'

export default async function AdminSearchAnalyticsPage() {
  // Buscar dados diretamente do banco
  let topQueries: { query: string; count: number; avg_score: number }[] = []
  let noResults: { query: string; count: number }[] = []
  let performance = { avg_ms: 0, p95_ms: 0 }
  let totalSearches = 0
  let byType: { query_type: string; count: number }[] = []

  try {
    ;[topQueries, noResults, performance, totalSearches, byType] = await Promise.all([
      prisma.$queryRawUnsafe<{ query: string; count: number; avg_score: number }[]>(
        `SELECT query, COUNT(*)::int as count, ROUND(AVG(top_score)::numeric, 3) as avg_score
         FROM search_logs WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY query ORDER BY count DESC LIMIT 20`
      ),
      prisma.$queryRawUnsafe<{ query: string; count: number }[]>(
        `SELECT query, COUNT(*)::int as count
         FROM search_logs WHERE results_count = 0 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY query ORDER BY count DESC LIMIT 20`
      ),
      prisma.$queryRawUnsafe<{ avg_ms: number; p95_ms: number }[]>(
        `SELECT ROUND(AVG(response_time_ms)::numeric, 0) as avg_ms,
                ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms))::numeric, 0) as p95_ms
         FROM search_logs WHERE created_at > NOW() - INTERVAL '30 days'`
      ).then(r => r[0] || { avg_ms: 0, p95_ms: 0 }),
      prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COUNT(*)::int as count FROM search_logs WHERE created_at > NOW() - INTERVAL '7 days'`
      ).then(r => r[0]?.count ?? 0),
      prisma.$queryRawUnsafe<{ query_type: string; count: number }[]>(
        `SELECT query_type, COUNT(*)::int as count
         FROM search_logs WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY query_type ORDER BY count DESC`
      ),
    ])
  } catch {
    // Tabela pode não existir ainda
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-8">Analytics de Busca</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-border rounded-md p-4 bg-[var(--color-bg-secondary)]">
          <p className="text-xs text-muted mb-1">Buscas (7 dias)</p>
          <p className="text-2xl font-bold">{totalSearches.toLocaleString('pt-BR')}</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-blue-50 dark:bg-blue-950/20">
          <p className="text-xs text-muted mb-1">Tempo médio</p>
          <p className="text-2xl font-bold text-blue-600">{performance.avg_ms}ms</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-xs text-muted mb-1">P95 latência</p>
          <p className="text-2xl font-bold text-amber-600">{performance.p95_ms}ms</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-red-50 dark:bg-red-950/20">
          <p className="text-xs text-muted mb-1">Buscas sem resultado</p>
          <p className="text-2xl font-bold text-red-600">
            {noResults.length > 0 ? noResults.reduce((a, b) => a + b.count, 0).toLocaleString('pt-BR') : 0}
          </p>
        </div>
      </div>

      {/* Queries mais frequentes */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Queries mais frequentes</h2>
        {topQueries.length === 0 ? (
          <p className="text-muted text-sm">Nenhum dado disponível ainda.</p>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg-secondary)]">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Query</th>
                  <th className="text-right px-4 py-2 font-medium">Buscas</th>
                  <th className="text-right px-4 py-2 font-medium">Score médio</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2">{q.query}</td>
                    <td className="px-4 py-2 text-right font-mono">{q.count}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {q.avg_score ? `${(Number(q.avg_score) * 100).toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Queries sem resultados */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Queries sem resultados</h2>
        {noResults.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma query sem resultado.</p>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg-secondary)]">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Query</th>
                  <th className="text-right px-4 py-2 font-medium">Ocorrências</th>
                </tr>
              </thead>
              <tbody>
                {noResults.map((q, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2">{q.query}</td>
                    <td className="px-4 py-2 text-right font-mono">{q.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Buscas por tipo */}
      {byType.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Buscas por tipo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {byType.map((t, i) => (
              <div key={i} className="border border-border rounded-md p-3 bg-[var(--color-bg-secondary)]">
                <p className="text-xs text-muted mb-1">{t.query_type || 'unknown'}</p>
                <p className="text-lg font-bold">{t.count.toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
