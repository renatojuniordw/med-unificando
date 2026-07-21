import { Badge } from '@/components/ui/badge'
import { StatusPill } from '@/components/ui/status-pill'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

interface SearchResultsCardsProps {
  results: { score: number; medicine: MedicineResult }[]
}

export function SearchResultsCards({ results }: SearchResultsCardsProps) {
  return (
    <div className="space-y-2" aria-live="polite" role="list">
      {results.map(r => (
        <Link
          key={r.medicine.id}
          href={`/medicamento/${r.medicine.id}`}
          className="block border border-border rounded-sm p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-colors"
          role="listitem"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-sm text-[var(--color-text)]">{r.medicine.tradeName}</span>
              <p className="text-xs text-muted mt-0.5 truncate">{r.medicine.activeIngredient}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {r.medicine.category && <Badge variant="primary">{r.medicine.category}</Badge>}
              {r.medicine.farmaciaPopular && <Badge variant="success">FP</Badge>}
              {r.medicine.status && <StatusPill status={r.medicine.status} />}
              <span className="text-xs text-muted">
                {(r.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted mt-1 truncate">{r.medicine.similarHolder}</p>
        </Link>
      ))}
    </div>
  )
}
