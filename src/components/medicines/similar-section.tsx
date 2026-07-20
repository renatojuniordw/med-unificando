import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import Link from 'next/link'

interface SimilarMedicine {
  id: number
  tradeName: string
  similarHolder: string | null
  status: string | null
}

export function SimilarSection({ similares, referenceMedicine }: { similares: SimilarMedicine[]; referenceMedicine: string }) {
  if (similares.length === 0) return null

  return (
    <Card className="mb-8">
      <p className="text-xs font-semibold text-muted mb-4">
        Similares de {referenceMedicine}
      </p>
      <div className="space-y-2">
        {similares.map(s => (
          <Link
            key={s.id}
            href={`/medicamento/${s.id}`}
            className="block border border-border rounded-sm p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-colors"
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
