'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusPill } from '@/components/ui/status-pill'
import type { MedicineResult } from '@/types'

interface SimilarMedicinesListProps {
  medicines: MedicineResult[]
}

export function SimilarMedicinesList({ medicines }: SimilarMedicinesListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return medicines
    return medicines.filter(med =>
      med.tradeName.toLowerCase().includes(term) ||
      med.activeIngredient.toLowerCase().includes(term) ||
      med.similarHolder.toLowerCase().includes(term)
    )
  }, [medicines, query])

  return (
    <div>
      <div className="mb-6">
        <Input
          label="Filtrar nesta lista"
          placeholder="Nome comercial, princípio ativo ou detentor..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="font-medium text-sm text-[var(--color-text)]">Nenhum medicamento encontrado para esse filtro.</p>
        ) : (
          filtered.map(med => (
            <Link
              key={med.id}
              href={`/medicamento/${med.id}`}
              className="block border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-sm text-[var(--color-text)]">{med.tradeName}</span>
                  <p className="text-xs text-muted mt-1">{med.activeIngredient}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {med.category && <Badge variant="primary">{med.category}</Badge>}
                  {med.status && <StatusPill status={med.status} />}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted">
                Ref: {med.reference} | {med.similarHolder}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
