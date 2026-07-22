import { getFeedbackStats, getLowQualityQueries } from '@/lib/actions/search-feedback'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default async function AdminSearchFeedbackPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const stats = await getFeedbackStats()
  const lowQuality = await getLowQualityQueries()

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-8">Dashboard de Feedback da Busca</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-border rounded-md p-4 bg-[var(--color-bg-secondary)]">
          <p className="text-xs text-muted mb-1">Total de Feedbacks</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-green-50 dark:bg-green-950/20">
          <p className="text-xs text-muted mb-1">Úteis</p>
          <p className="text-2xl font-bold text-green-600">{stats.helpful}</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-red-50 dark:bg-red-950/20">
          <p className="text-xs text-muted mb-1">Não úteis</p>
          <p className="text-2xl font-bold text-red-600">{stats.notHelpful}</p>
        </div>
        <div className="border border-border rounded-md p-4 bg-blue-50 dark:bg-blue-950/20">
          <p className="text-xs text-muted mb-1">Precisão da Busca</p>
          <p className="text-2xl font-bold text-blue-600">{stats.accuracy}%</p>
        </div>
      </div>

      {/* Queries de baixa qualidade */}
      {lowQuality.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            ⚠️ Queries com Baixa Precisão
            <span className="text-xs text-muted font-normal">
              (menos de 50% de aprovação, mínimo 3 feedbacks)
            </span>
          </h2>
          <div className="space-y-2">
            {lowQuality.map((item) => (
              <div key={item.query} className="border border-border rounded-sm p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.query}</span>
                  <Badge variant={item.accuracy < 30 ? 'muted' : 'secondary'}>
                    {item.accuracy}% de aprovação
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                  <span>Total: {item.total}</span>
                  <span className="text-green-600">Úteis: {item.helpful}</span>
                  <span className="text-red-600">Não úteis: {item.notHelpful}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowQuality.length === 0 && stats.total > 0 && (
        <div className="mb-8 p-4 border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✅ Nenhuma query com baixa precisão identificada. A busca está funcionando bem!
          </p>
        </div>
      )}

      {stats.total === 0 && (
        <div className="mb-8 p-4 border border-border bg-[var(--color-bg-secondary)] rounded-md">
          <p className="text-sm text-muted">
            Nenhum feedback recebido ainda. Os feedbacks aparecerão aqui conforme os usuários interagirem com os resultados da busca.
          </p>
        </div>
      )}

      {/* Top queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">📊 Top 10 Termos de Busca</h2>
          <div className="space-y-2">
            {stats.topQueries.slice(0, 10).map((item) => (
              <div key={item.query} className="border border-border rounded-sm p-2 flex items-center justify-between">
                <span className="text-sm truncate flex-1">{item.query}</span>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span>{item.count}x</span>
                  <span className="text-green-600">{item.helpful} 👍</span>
                  <span className="text-red-600">{item.notHelpful} 👎</span>
                  <span className="text-muted">
                    {item.count > 0 ? Math.round((item.helpful / item.count) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
            {stats.topQueries.length === 0 && (
              <p className="text-sm text-muted">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">💊 Top 10 Medicamentos com Feedback</h2>
          <div className="space-y-2">
            {stats.topMedicines.slice(0, 10).map((item) => (
              <div key={item.medicineName} className="border border-border rounded-sm p-2 flex items-center justify-between">
                <span className="text-sm truncate flex-1">{item.medicineName}</span>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span>{item.count}x</span>
                  <span className="text-green-600">{item.helpful} 👍</span>
                  <span className="text-red-600">{item.notHelpful} 👎</span>
                  <span className="text-muted">
                    {item.count > 0 ? Math.round((item.helpful / item.count) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
            {stats.topMedicines.length === 0 && (
              <p className="text-sm text-muted">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted text-center">
        Os dados de feedback são armazenados no banco de dados PostgreSQL.
        Feedbacks podem ser usados no futuro para ajustar automaticamente os scores de busca.
      </p>
    </main>
  )
}