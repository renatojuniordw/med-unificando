'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusPill } from '@/components/ui/status-pill'
import { PaginationBar } from '@/components/ui/pagination'
import type { MedicineResult } from '@/types'

interface SimilarMedicinesListProps {
  medicines: MedicineResult[]
}

const PAGE_SIZE = 20

export function SimilarMedicinesList({ medicines }: SimilarMedicinesListProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return medicines
    return medicines.filter(med =>
      med.tradeName.toLowerCase().includes(term) ||
      med.activeIngredient.toLowerCase().includes(term) ||
      med.similarHolder.toLowerCase().includes(term)
    )
  }, [medicines, query])

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedMeds = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  // Reset page quando filtro muda
  useEffect(() => {
    setPage(1)
  }, [query])

  return (
    <div>
      <div className="mb-6">
        <Input
          label="Filtrar nesta lista"
          placeholder="Nome comercial, princípio ativo ou detentor..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filtrar medicamentos similares"
          autoComplete="off"
        />
      </div>

      <div className="space-y-3" role="list" aria-label="Lista de medicamentos similares">
        {paginatedMeds.length === 0 ? (
          <p className="font-medium text-sm text-[var(--color-text)]" role="status">
            {query
              ? 'Nenhum medicamento encontrado para esse filtro.'
              : 'Nenhum medicamento similar cadastrado.'}
          </p>
        ) : (
          paginatedMeds.map(med => (
            <Link
              key={med.id}
              href={`/medicamento/${med.id}`}
              className="block border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all group"
              role="listitem"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-sm text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors">
                    {med.tradeName}
                  </span>
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

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4">
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            label="medicamento"
          />
        </div>
      )}
    </div>
  )
}
