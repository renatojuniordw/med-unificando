import { Card } from '@/components/ui/card'
import { PriceChart } from '@/components/medicines/price-chart'

interface Price {
  id: number
  presentation: string
  pf0Price: number | null
  pf18Price: number | null
  company: string | null
}

export function PriceSection({ prices }: { prices: Price[] }) {
  if (prices.length === 0) return null

  const maxPrice = Math.max(...prices.map(p => p.pf0Price ?? p.pf18Price ?? 0))

  return (
    <Card>
      <p className="text-xs font-semibold text-muted mb-4">Preços CMED</p>

      {/* Gráfico de barras */}
      <PriceChart prices={prices} />

      {/* Barras de progresso (top 5) */}
      <div className="mb-6 space-y-2">
        {prices.slice(0, 5).map(p => {
          const val = p.pf0Price ?? 0
          const width = maxPrice > 0 ? (val / maxPrice) * 100 : 0
          return (
            <div key={p.id} className="flex items-center gap-3 text-xs">
              <span className="w-2/5 truncate font-medium text-[var(--color-text)]">{p.presentation}</span>
              <div className="flex-1 h-3 bg-[var(--color-bg-secondary)] rounded-sm overflow-hidden">
                <div className="h-full bg-brand-black rounded-sm" style={{ width: `${width}%` }} />
              </div>
              <span className="w-16 text-right font-semibold">R${val.toFixed(2)}</span>
            </div>
          )
        })}
      </div>

      <div className="overflow-x-auto border border-border rounded-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)]">
              <th className="text-left p-2.5 font-semibold text-muted">Apresentação</th>
              <th className="text-left p-2.5 font-semibold text-muted">PF0</th>
              <th className="text-left p-2.5 font-semibold text-muted">PF18</th>
              <th className="text-left p-2.5 font-semibold text-muted">Empresa</th>
            </tr>
          </thead>
          <tbody>
            {prices.map(p => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-2.5 font-medium">{p.presentation}</td>
                <td className="p-2.5">{p.pf0Price ? `R$${p.pf0Price.toFixed(2)}` : '-'}</td>
                <td className="p-2.5">{p.pf18Price ? `R$${p.pf18Price.toFixed(2)}` : '-'}</td>
                <td className="p-2.5">{p.company}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
