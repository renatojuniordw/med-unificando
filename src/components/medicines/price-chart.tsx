'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Price {
  id: number
  presentation: string
  pf0Price: number | null
  pf18Price: number | null
  company: string | null
}

const COLORS = ['#1a1a1a', '#eab308', '#64748b']

export function PriceChart({ prices }: { prices: Price[] }) {
  if (prices.length === 0) return null

  // Limitar a 10 para não poluir o gráfico
  const topPrices = prices.slice(0, 10)

  const chartData = topPrices.map(p => ({
    name: p.presentation.length > 25
      ? p.presentation.substring(0, 25) + '…'
      : p.presentation,
    'PF0': p.pf0Price ?? 0,
    'PF18': p.pf18Price ?? 0,
  }))

  return (
    <div className="mb-6">
      <p className="text-xs text-muted mb-3">Comparativo de Preços (até 10 apresentações)</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
              tickFormatter={(v: number) => `R$${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="PF0" name="PF0 (Preço Fábrica)" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
            <Bar dataKey="PF18" name="PF18 (Preço Máximo)" fill={COLORS[1]} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
