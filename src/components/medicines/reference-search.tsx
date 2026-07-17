'use client'

import Link from 'next/link'
import { searchReferenceMedicines } from '@/lib/actions/references'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ReferenceItem {
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
          label="BUSCAR REFERÊNCIA"
          placeholder="Digite o nome do medicamento de referência..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {isSearching && searching ? (
          <p className="font-bold uppercase text-sm text-slate-500">Buscando...</p>
        ) : references.length === 0 ? (
          <p className="font-bold uppercase text-sm">
            {isSearching
              ? 'Nenhuma referência encontrada para essa busca.'
              : 'Nenhum medicamento de referência encontrado.'}
          </p>
        ) : (
          references.map(ref => (
            <Link
              key={ref.name}
              href={`/referencias/${encodeURIComponent(ref.name)}`}
              className="block border-4 border-brutalist-black bg-white p-4 hover:bg-neon-yellow hover:-translate-y-1 hover:shadow-hard-lg transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="font-black uppercase tracking-tight">{ref.name}</span>
                <Badge variant="primary">{ref.count} similares</Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
