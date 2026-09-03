'use client'

import { useAutocomplete } from '@/hooks/use-autocomplete'
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
  const { activeIndex, setActiveIndex, containerRef, inputRef, handleKeyDown } = useAutocomplete({
    itemCount: results.length,
    onSelect: (index) => onAdd(results[index].id),
  })

  return (
    <div className="relative" ref={containerRef}>
      <Input
        ref={inputRef}
        data-testid="compare-search-input"
        label="Adicionar medicamento para comparação"
        placeholder="Digite referência, princípio ativo ou nome comercial..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
        autoComplete="off"
      />
      {searching && (
        <div className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1 p-3">
          <p className="text-sm text-muted">Buscando...</p>
        </div>
      )}
      {!searching && results.length > 0 && (
        <div
          className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label="Resultados da busca"
        >
          {results.map((item, i) => (
            <button
              key={item.id}
              type="button"
              data-testid="compare-search-option"
              role="option"
              aria-selected={i === activeIndex}
              className={`block w-full text-left px-4 py-2.5 text-sm text-[var(--color-text)] border-b border-border last:border-b-0 transition-colors ${
                i === activeIndex
                  ? 'bg-brand-yellow/15'
                  : 'hover:bg-brand-yellow/10'
              }`}
              onClick={() => onAdd(item.id)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
