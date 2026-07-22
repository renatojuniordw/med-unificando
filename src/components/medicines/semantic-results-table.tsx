import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { columns } from '@/components/medicines/medicine-table'
import { getRelevanceLabel } from '@/lib/search-relevance'
import type { MedicineResult } from '@/types'

interface SemanticResultsTableProps {
  results: { score: number; medicine: MedicineResult }[]
}

const RELEVANCE_BADGE_VARIANT = {
  high: 'success',
  medium: 'secondary',
  low: 'muted',
} as const

export function SemanticResultsTable({ results }: SemanticResultsTableProps) {
  const mobileColumns = columns.filter(col => col.mobile)
  return (
    <div className="overflow-x-auto border border-border rounded-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
            {mobileColumns.map((col) => (
              <th
                key={col.key}
                className="text-left p-3 text-xs font-semibold text-muted"
              >
                {col.label}
              </th>
            ))}
            <th className="text-left p-3 text-xs font-semibold text-muted w-20">
              Relevância
            </th>
            <th className="text-left p-3 text-xs font-semibold text-muted w-24">
              FP
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map(({ score, medicine }, index) => {
            const relevance = getRelevanceLabel(score)
            return (
              <tr
                key={medicine.id}
                className={`border-b border-border hover:bg-brand-yellow/5 transition-colors ${
                  index % 2 === 0 ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-bg-secondary)]/50'
                }`}
              >
                {mobileColumns.map((col) => {
                  const value = (medicine as unknown as Record<string, string>)[col.key]
                  const display = value ?? ''
                  if (col.key === 'tradeName' || col.key === 'reference') {
                    return (
                      <td key={col.key} className="p-3 text-sm font-medium">
                        <Link
                          href={`/medicamento/${medicine.id}`}
                          className="text-[var(--color-text)] hover:underline"
                        >
                          {display}
                        </Link>
                        {medicine.indications && (
                          <p className="text-xs text-muted font-normal mt-0.5 truncate max-w-xs">
                            Indicado para: {medicine.indications}
                          </p>
                        )}
                      </td>
                    )
                  }
                  return (
                    <td key={col.key} className="p-3 text-sm text-[var(--color-text)]">
                      {display}
                    </td>
                  )
                })}
                <td className="p-3 text-sm">
                  <Badge variant={RELEVANCE_BADGE_VARIANT[relevance.tier]} title={`${(score * 100).toFixed(0)}% de confiança`}>
                    {relevance.label} · {(score * 100).toFixed(0)}%
                  </Badge>
                </td>
                <td className="p-3 text-sm">
                  {medicine.farmaciaPopular && (
                    <Badge variant="success">FP</Badge>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
