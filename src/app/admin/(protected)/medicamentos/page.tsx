'use client'

import Link from 'next/link'
import { searchMedicinesForAdmin } from '@/lib/actions/medicines-admin'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AdminMedicinesSearchPage() {
  const router = useRouter()
  const { query, setQuery, results, searching } = useDebouncedSearch(searchMedicinesForAdmin)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="primary" className="mb-3">Admin</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--color-text)]">
            Editar Medicamento
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/import')}>← Voltar</Button>
      </div>

      <div className="mb-6">
        <Input
          label="Buscar medicamento"
          placeholder="Referência, princípio ativo ou nome comercial..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {query.length >= 2 && searching && (
          <p className="text-sm text-muted">Buscando...</p>
        )}
        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-sm text-muted">Nenhum medicamento encontrado.</p>
        )}
        {results.map(med => (
          <Link
            key={med.id}
            href={`/admin/medicamentos/${med.id}`}
            className="block border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all"
          >
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <span className="font-medium text-sm text-[var(--color-text)]">{med.tradeName}</span>
                <p className="text-xs text-muted truncate">{med.activeIngredient}</p>
              </div>
              {med.status && <Badge variant="primary">{med.status}</Badge>}
            </div>
            <p className="text-xs text-muted mt-1">Ref: {med.reference}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
