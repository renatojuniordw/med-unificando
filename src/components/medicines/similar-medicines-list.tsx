'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
          label="FILTRAR NESTA LISTA"
          placeholder="Nome comercial, princípio ativo ou detentor..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="font-bold uppercase text-sm">Nenhum medicamento encontrado para esse filtro.</p>
        ) : (
          filtered.map(med => (
            <Link
              key={med.id}
              href={`/medicamento/${med.id}`}
              className="block border-4 border-brutalist-black bg-white p-4 hover:bg-neon-yellow hover:-translate-y-1 hover:shadow-hard-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="font-black uppercase text-sm">{med.tradeName}</span>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-1">{med.activeIngredient}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {med.category && <Badge variant="primary">{med.category}</Badge>}
                  {med.status === 'Ativo' && <span className="text-[10px] font-black uppercase text-success-green bg-white border-2 border-brutalist-black px-2 py-1">ATIVO</span>}
                  {med.status === 'Inativo' && <span className="text-[10px] font-black uppercase text-error-red bg-white border-2 border-brutalist-black px-2 py-1">INATIVO</span>}
                </div>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                Ref: {med.reference} | {med.similarHolder}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
