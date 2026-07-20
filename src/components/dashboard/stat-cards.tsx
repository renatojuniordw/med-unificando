import { Card } from '@/components/ui/card'

interface StatCardsProps {
  stats: {
    totalMedicines: number
    totalReferences: number
    ativoCount: number
    inativoCount: number
  }
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-6">
      <Card>
        <p className="text-xs font-semibold text-muted mb-2">Total</p>
        <p className="text-4xl font-black tracking-tighter text-[var(--color-text)]">{stats.totalMedicines.toLocaleString()}</p>
      </Card>
      <Card>
        <p className="text-xs font-semibold text-muted mb-2">Medicamentos Distintos</p>
        <p className="text-4xl font-black tracking-tighter text-[var(--color-text)]">{stats.totalReferences.toLocaleString()}</p>
      </Card>
      <Card variant="active">
        <p className="text-xs font-semibold text-muted mb-2">Ativos</p>
        <p className="text-4xl font-black tracking-tighter text-success">{stats.ativoCount.toLocaleString()}</p>
      </Card>
      <Card variant="inactive">
        <p className="text-xs font-semibold text-muted mb-2">Inativos</p>
        <p className="text-4xl font-black tracking-tighter text-error">{stats.inativoCount.toLocaleString()}</p>
      </Card>
    </div>
  )
}
