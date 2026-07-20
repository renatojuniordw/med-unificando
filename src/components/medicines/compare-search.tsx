'use client'

import { Input } from '@/components/ui/input'

interface SearchItem {
  id: number
  label: string
}

interface CompareSearchProps {
  query: string
  onQueryChange: (value: string) => void
  results: SearchItem[]
  searching: boolean
  onAdd: (id: number) => void
}

export function CompareSearch({ query, onQueryChange, results, searching, onAdd }: CompareSearchProps) {
  return (
    <div className="relative">
      <Input
        label="Adicionar medicamento para comparação"
        placeholder="Digite referência, princípio ativo ou nome comercial..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {searching && (
        <div className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1 p-3">
          <p className="text-sm text-muted">Buscando...</p>
        </div>
      )}
      {!searching && results.length > 0 && (
        <div
          className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1"
          role="listbox"
          aria-label="Resultados da busca"
        >
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              className="block w-full text-left px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-brand-yellow/10 transition-colors border-b border-border last:border-b-0"
              onClick={() => onAdd(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
