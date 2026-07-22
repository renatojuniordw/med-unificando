'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActiveIndex(-1)
  }, [results.length])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Let the parent handle it
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length > 0 && activeIndex >= 0 && results[activeIndex]) {
        onAdd(results[activeIndex].id)
        inputRef.current?.focus()
      }
      return
    }

    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => prev < results.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => prev > 0 ? prev - 1 : results.length - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setActiveIndex(-1)
    }
  }, [results, activeIndex, onAdd])

  return (
    <div className="relative" ref={containerRef}>
      <Input
        ref={inputRef}
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
