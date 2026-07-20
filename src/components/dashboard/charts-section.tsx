import { Badge } from '@/components/ui/badge'
import { BarChart } from '@/components/ui/bar-chart'
import type { DashboardStats } from '@/types'

interface ChartsSectionProps {
  stats: DashboardStats
}

export function ChartsSection({ stats }: ChartsSectionProps) {
  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6">
          <Badge variant="primary" className="mb-4">Top 10 Medicamentos</Badge>
          <BarChart items={stats.topReferences} barColor="bg-brand-yellow" />
        </div>

        <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6">
          <Badge variant="primary" className="mb-4">Top 10 Princípios Ativos</Badge>
          <BarChart items={stats.topActiveIngredients} barColor="bg-brand-black" />
        </div>

        <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6">
          <Badge variant="primary" className="mb-4">Categorias</Badge>
          <BarChart items={stats.categories.map(c => ({ name: c.name || 'Sem categoria', count: c.count }))} barColor="bg-brand-yellow" />
        </div>
      </div>

      <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6 mt-8">
        <Badge variant="primary" className="mb-4">Timeline — Registros por Ano</Badge>
        <div className="max-h-80 overflow-y-auto">
          <BarChart items={stats.timeline.map(t => ({ name: t.year, count: t.count }))} barColor="bg-brand-black" className="space-y-0.5" />
        </div>
      </div>
    </>
  )
}
