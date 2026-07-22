'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AtcLevelItem {
  code: string
  count: number
}

interface AtcTreeProps {
  level1: AtcLevelItem[]
  level2: AtcLevelItem[]
  level3: AtcLevelItem[]
}

const INITIAL_SHOW = 40

export function AtcTree({ level1, level2, level3 }: AtcTreeProps) {
  const [query, setQuery] = useState('')
  const [showAllLevel2, setShowAllLevel2] = useState(false)
  const [showAllLevel3, setShowAllLevel3] = useState(false)
  const [suggestions, setSuggestions] = useState<AtcLevelItem[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const term = query.trim().toLowerCase()
  const isSearching = term.length > 0

  // Combinar todos os níveis para o autocomplete
  const allCodes = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of [...level1, ...level2, ...level3]) {
      map.set(item.code, (map.get(item.code) || 0) + item.count)
    }
    return Array.from(map.entries()).map(([code, count]) => ({ code, count }))
  }, [level1, level2, level3])

  const filteredLevel1 = useMemo(
    () => level1.filter(item => item.code.toLowerCase().includes(term)),
    [level1, term]
  )
  const filteredLevel2 = useMemo(
    () => level2.filter(item => item.code.toLowerCase().includes(term)),
    [level2, term]
  )
  const filteredLevel3 = useMemo(
    () => level3.filter(item => item.code.toLowerCase().includes(term)),
    [level3, term]
  )

  const visibleLevel2 = isSearching || showAllLevel2 ? filteredLevel2 : filteredLevel2.slice(0, INITIAL_SHOW)
  const visibleLevel3 = isSearching || showAllLevel3 ? filteredLevel3 : filteredLevel3.slice(0, INITIAL_SHOW)

  // Autocomplete dropdown
  useEffect(() => {
    if (term.length < 1) {
      setSuggestions([])
      return
    }
    const filtered = allCodes
      .filter(item => item.code.toLowerCase().includes(term))
      .slice(0, 8)
    setSuggestions(filtered)
    setActiveIndex(-1)
  }, [term, allCodes])

  // Click outside para fechar autocomplete
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && activeIndex >= 0 && suggestions[activeIndex]) {
        setQuery(suggestions[activeIndex].code)
        setSuggestions([])
      }
      return
    }
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSuggestions([])
      setActiveIndex(-1)
    }
  }, [suggestions, activeIndex])

  return (
    <div className="space-y-10" ref={containerRef}>
      {/* Busca com autocomplete */}
      <div className="relative">
        <Input
          label="Buscar Código ATC"
          placeholder="Ex: A10, C09AA, N02BE01..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div
            className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1"
            role="listbox"
            aria-label="Sugestões de códigos ATC"
          >
            {suggestions.map((item, i) => (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => {
                  setQuery(item.code)
                  setSuggestions([])
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`block w-full text-left px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-brand-yellow/10 border-b border-border last:border-b-0 transition-colors ${
                  i === activeIndex ? 'bg-brand-yellow/15' : ''
                }`}
              >
                <span className="font-medium">{item.code}</span>
                <span className="ml-2 text-xs text-muted">{item.count} medicamento{item.count !== 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <section>
        <Badge variant="primary" className="mb-4">Nível 1 — Anatômico</Badge>
        {filteredLevel1.length === 0 ? (
          <p className="text-sm text-muted">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLevel1.map(item => (
              <Link
                key={item.code}
                href={`/atc/${item.code}`}
                className="border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all group"
              >
                <span className="font-semibold text-lg text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors">{item.code}</span>
                <span className="ml-2 text-xs text-muted">{item.count} código{item.count !== 1 ? 's' : ''}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="primary">Nível 2 — Terapêutico</Badge>
          {!isSearching && filteredLevel2.length > INITIAL_SHOW && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAllLevel2(prev => !prev)}
            >
              {showAllLevel2 ? '▲ Recolher' : `▼ Mostrar todos (${filteredLevel2.length})`}
            </Button>
          )}
        </div>
        {visibleLevel2.length === 0 ? (
          <p className="text-sm text-muted">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-2">
            {visibleLevel2.map(item => (
              <Link
                key={item.code}
                href={`/atc/${item.code}`}
                className="border border-border rounded-sm bg-[var(--color-bg)] p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all text-sm font-medium text-[var(--color-text)] group"
              >
                {item.code} <span className="text-muted ml-1 group-hover:text-[var(--color-brand)]">({item.count})</span>
              </Link>
            ))}
          </div>
        )}
        {!isSearching && !showAllLevel2 && filteredLevel2.length > INITIAL_SHOW && (
          <p className="text-xs text-muted mt-2">
            + {filteredLevel2.length - INITIAL_SHOW} código{filteredLevel2.length - INITIAL_SHOW !== 1 ? 's' : ''} de nível 2 — clique em &ldquo;Mostrar todos&rdquo;
          </p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="primary">Nível 3 — Químico</Badge>
          {!isSearching && filteredLevel3.length > INITIAL_SHOW && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAllLevel3(prev => !prev)}
            >
              {showAllLevel3 ? '▲ Recolher' : `▼ Mostrar todos (${filteredLevel3.length})`}
            </Button>
          )}
        </div>
        {visibleLevel3.length === 0 ? (
          <p className="text-sm text-muted">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-2">
            {visibleLevel3.map(item => (
              <Link
                key={item.code}
                href={`/atc/${item.code}`}
                className="border border-border rounded-sm bg-[var(--color-bg)] p-2 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all text-xs font-medium text-[var(--color-text)] group"
              >
                {item.code} <span className="text-muted group-hover:text-[var(--color-brand)]">({item.count})</span>
              </Link>
            ))}
          </div>
        )}
        {!isSearching && !showAllLevel3 && filteredLevel3.length > INITIAL_SHOW && (
          <p className="text-xs text-muted mt-2">
            + {filteredLevel3.length - INITIAL_SHOW} código{filteredLevel3.length - INITIAL_SHOW !== 1 ? 's' : ''} de nível 3 — clique em &ldquo;Mostrar todos&rdquo;
          </p>
        )}
      </section>
    </div>
  )
}
