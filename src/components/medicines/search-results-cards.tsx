"use client";

import { useState } from "react";
import { StatusPill } from '@/components/ui/status-pill'
import { submitSearchFeedback } from '@/lib/actions/search-feedback'
import Link from 'next/link'
import type { MedicineResult } from '@/types'
import type { MatchReason } from '@/lib/actions/semantic-search'

interface SearchResultsCardsProps {
  results: { score: number; medicine: MedicineResult; matchReasons?: MatchReason[] }[]
  searchQuery?: string
}

function MatchReasonBadges({ reasons }: { reasons: MatchReason[] }) {
  if (!reasons || reasons.length === 0) return null

  const labels: Record<MatchReason['type'], string> = {
    semantic: 'Semântica',
    keyword: 'Palavra-chave',
    trigram: 'Similaridade',
    'name-exact': 'Nome exato',
    'name-prefix': 'Nome similar',
    'ingredient-match': 'Ingrediente',
  }

  const colors: Record<MatchReason['type'], string> = {
    semantic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    keyword: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    trigram: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'name-exact': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'name-prefix': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'ingredient-match': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reasons.map((r, i) => (
        <span
          key={`${r.type}-${i}`}
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors[r.type]}`}
          title={r.type === 'semantic' || r.type === 'keyword' || r.type === 'trigram'
            ? `Score: ${(r.score * 100).toFixed(0)}%`
            : `Boost: +${(r.boost * 100).toFixed(0)}%`}
        >
          {labels[r.type]}
        </span>
      ))}
    </div>
  )
}

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
      {results.map(r => (
          <Link
            key={r.medicine.id}
            href={`/medicamento/${r.medicine.id}`}
            className="group flex items-start gap-3 border border-border rounded-sm px-3 py-2.5 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-colors"
            role="listitem"
          >
            {/* Coluna principal — informações enxutas */}
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-sm text-[var(--color-text)] leading-tight">
                {r.medicine.tradeName}
              </span>
              {r.matchReasons && <MatchReasonBadges reasons={r.matchReasons} />}
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
      ))}
    </div>
  )
}