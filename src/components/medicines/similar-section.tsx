import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import Link from 'next/link'

interface SimilarMedicine {
  id: number
  tradeName: string
  similarHolder: string | null
  status: string | null
}

export function SimilarSection({ similares, referenceMedicine, currentMedicineId }: { similares: SimilarMedicine[]; referenceMedicine: string; currentMedicineId?: number }) {
  if (similares.length === 0) return null

  const currentIndex = currentMedicineId
    ? similares.findIndex(s => s.id === currentMedicineId)
    : -1

  return (
    <Card className="mb-8">
      <p className="text-xs font-semibold text-muted mb-4">
        {similares.length} similar{similares.length !== 1 ? 'es' : ''} de {referenceMedicine}
      </p>

      {/* Navegação entre similares */}
      {currentMedicineId && currentIndex >= 0 && (
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
          {currentIndex > 0 ? (
            <Link
              href={`/medicamento/${similares[currentIndex - 1].id}`}
              className="text-xs text-[var(--color-brand)] hover:underline flex items-center gap-1"
            >
              ← {similares[currentIndex - 1].tradeName}
            </Link>
          ) : <div />}
          <span className="text-[10px] text-muted">
            {currentIndex + 1} de {similares.length}
          </span>
          {currentIndex < similares.length - 1 ? (
            <Link
              href={`/medicamento/${similares[currentIndex + 1].id}`}
              className="text-xs text-[var(--color-brand)] hover:underline flex items-center gap-1"
            >
              {similares[currentIndex + 1].tradeName} →
            </Link>
          ) : <div />}
        </div>
      )}

      <div className="space-y-2">
        {similares.map(s => (
          <Link
            key={s.id}
            href={`/medicamento/${s.id}`}
            className={`block border rounded-sm p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-colors ${
              currentMedicineId === s.id
                ? 'border-brand-yellow bg-brand-yellow/10'
                : 'border-border'
            }`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium text-sm text-[var(--color-text)]">{s.tradeName}</span>
              <span className="text-xs text-muted">{s.similarHolder}</span>
              <StatusPill status={s.status} />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
