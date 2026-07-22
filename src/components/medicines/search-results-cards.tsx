"use client";

import { useState } from "react";
import { Badge } from '@/components/ui/badge'
import { StatusPill } from '@/components/ui/status-pill'
import { getRelevanceLabel } from '@/lib/search-relevance'
import { submitSearchFeedback } from '@/lib/actions/search-feedback'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

interface SearchResultsCardsProps {
  results: { score: number; medicine: MedicineResult }[]
  searchQuery?: string
}

const RELEVANCE_BADGE_VARIANT = {
  high: 'success',
  medium: 'secondary',
  low: 'muted',
} as const

function FeedbackButton({ query, medicineId, medicineName }: {
  query: string; medicineId: number; medicineName: string
}) {
  const [status, setStatus] = useState<'idle' | 'done'>('idle')

  async function handleClick(feedback: 'helpful' | 'not_helpful') {
    if (status === 'done') return
    await submitSearchFeedback({ query, medicineId, medicineName, feedback })
    setStatus('done')
  }

  if (status === 'done') {
    return <span className="text-[10px] text-muted/40">✓</span>
  }

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); handleClick('helpful'); }}
        className="text-xs text-muted/40 hover:text-green-500 transition-colors"
        title="Útil"
      >👍</button>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); handleClick('not_helpful'); }}
        className="text-xs text-muted/40 hover:text-red-500 transition-colors"
        title="Não útil"
      >👎</button>
    </div>
  )
}

export function SearchResultsCards({ results, searchQuery }: SearchResultsCardsProps) {
  return (
    <div className="space-y-1.5" aria-live="polite" role="list">
      {results.map(r => {
        const relevance = getRelevanceLabel(r.score)
        return (
          <Link
            key={r.medicine.id}
            href={`/medicamento/${r.medicine.id}`}
            className="group flex items-start gap-3 border border-border rounded-sm px-3 py-2.5 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-colors"
            role="listitem"
          >
            {/* Coluna principal — informações enxutas */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--color-text)] leading-tight">
                  {r.medicine.tradeName}
                </span>
                {/* Badge de relevância compacto */}
                <Badge
                  variant={RELEVANCE_BADGE_VARIANT[relevance.tier]}
                  title={`${(r.score * 100).toFixed(0)}% de confiança`}
                  className="shrink-0 text-[10px] px-1.5 py-0 leading-tight"
                >
                  {(r.score * 100).toFixed(0)}%
                </Badge>
              </div>
              <p className="text-xs text-muted mt-0.5 truncate">
                {r.medicine.activeIngredient}
                {r.medicine.similarHolder && <span className="text-muted/50"> · {r.medicine.similarHolder}</span>}
              </p>
              {r.medicine.indications && (
                <p className="text-[11px] text-muted/60 mt-0.5 truncate">
                  {r.medicine.indications}
                </p>
              )}
              {/* Tags só quando relevantes, tudo na mesma linha */}
              {(r.medicine.category || r.medicine.farmaciaPopular || r.medicine.status) && (
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {r.medicine.category && (
                    <span className="text-[10px] text-muted/50 bg-[var(--color-bg-secondary)] px-1.5 py-0.5 rounded">
                      {r.medicine.category}
                    </span>
                  )}
                  {r.medicine.farmaciaPopular && (
                    <span className="text-[10px] text-green-600/70 bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded">
                      FP
                    </span>
                  )}
                  {r.medicine.status && (
                    <StatusPill status={r.medicine.status} />
                  )}
                </div>
              )}
            </div>

            {/* Coluna da direita — feedback discreto (só aparece no hover) */}
            <div className="shrink-0 pt-1">
              {searchQuery && (
                <FeedbackButton
                  query={searchQuery}
                  medicineId={r.medicine.id}
                  medicineName={r.medicine.tradeName}
                />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}