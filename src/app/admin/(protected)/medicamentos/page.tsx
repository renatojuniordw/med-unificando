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
          <Badge variant="primary" className="mb-3">ADMIN</Badge>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brutalist-black">
            Editar Medicamento
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/import')}>← VOLTAR</Button>
      </div>

      <div className="mb-6">
        <Input
          label="BUSCAR MEDICAMENTO"
          placeholder="Referência, princípio ativo ou nome comercial..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {query.length >= 2 && searching && (
          <p className="font-mono text-sm text-slate-500">Buscando...</p>
        )}
        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="font-mono text-sm text-slate-500">Nenhum medicamento encontrado.</p>
        )}
        {results.map(med => (
          <Link
            key={med.id}
            href={`/admin/medicamentos/${med.id}`}
            className="block border-4 border-brutalist-black bg-white p-4 hover:bg-neon-yellow hover:-translate-y-1 hover:shadow-hard-lg transition-all"
          >
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <span className="font-black uppercase text-sm">{med.tradeName}</span>
                <p className="text-xs font-mono text-slate-600 truncate">{med.activeIngredient}</p>
              </div>
              {med.status && <Badge variant="primary">{med.status}</Badge>}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">Ref: {med.reference}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
