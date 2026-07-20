'use client'

import Link from 'next/link'
import { searchReferenceMedicines } from '@/lib/actions/references'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface ReferenceItem {
  name: string
  count: number
}

interface ReferenceSearchProps {
  initialReferences: ReferenceItem[]
}

export function ReferenceSearch({ initialReferences }: ReferenceSearchProps) {
  const { query, setQuery, results, searching } = useDebouncedSearch(searchReferenceMedicines)

  const isSearching = query.length >= 2
  const references = isSearching ? results : initialReferences

  return (
    <div>
      <div className="mb-6">
        <Input
          label="Buscar Referência"
          placeholder="Digite o nome do medicamento de referência..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {isSearching && searching ? (
          <p className="text-sm text-muted">Buscando...</p>
        ) : references.length === 0 ? (
          <p className="text-sm text-[var(--color-text)] font-medium">
            {isSearching
              ? 'Nenhuma referência encontrada para essa busca.'
              : 'Nenhum medicamento de referência encontrado.'}
          </p>
        ) : (
          references.map(ref => (
            <Link
              key={ref.name}
              href={`/referencias/${encodeURIComponent(ref.name)}`}
              className="block border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-[var(--color-text)]">{ref.name}</span>
                <Badge variant="primary">{ref.count} similares</Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
