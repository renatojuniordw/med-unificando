'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { searchReferenceMedicines } from '@/lib/actions/references'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PaginationBar } from '@/components/ui/pagination'

export interface ReferenceItem {
  name: string
  count: number
}

interface ReferenceSearchProps {
  initialReferences: ReferenceItem[]
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const PAGE_SIZE = 20

export function ReferenceSearch({ initialReferences }: ReferenceSearchProps) {
  const { query, setQuery, results, searching } = useDebouncedSearch(searchReferenceMedicines)
  const [letterFilter, setLetterFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'count' | 'name-asc' | 'name-desc'>('count')
  const [page, setPage] = useState(1)

  const hasActiveSearch = query.length >= 2
  const hasSearchData = hasActiveSearch && !searching && results.length > 0
  const isStillSearching = hasActiveSearch && (searching || (!searching && results.length === 0 && query.length >= 2))
  const isEmptySearch = hasActiveSearch && !searching && results.length === 0

  // Filtro A-Z + sort aplicado sobre initialReferences (quando não há busca ativa ou ainda está buscando)
  const processedReferences = useMemo(() => {
    // Fonte: resultados da busca ou lista inicial
    const source = hasSearchData ? results : initialReferences

    let items = [...source]

    // Filtro por letra
    if (!hasSearchData && letterFilter) {
      const lc = letterFilter.toLowerCase()
      items = items.filter(ref => ref.name.toLowerCase().startsWith(lc))
    }

    // Ordenação
    if (sortBy === 'name-asc') {
      items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    } else if (sortBy === 'name-desc') {
      items.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'))
    }
    // 'count' já vem ordenado do servidor

    return items
  }, [initialReferences, results, hasSearchData, letterFilter, sortBy])

  // Paginação
  const totalPages = Math.max(1, Math.ceil(processedReferences.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedRefs = processedReferences.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  // Contagem visível
  const displayCount = hasSearchData ? results.length : initialReferences.length
  const filteredCount = processedReferences.length

  // Resetar página quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [query, letterFilter, sortBy])

  function toggleLetter(letter: string) {
    setLetterFilter(prev => prev === letter ? null : letter)
  }

  return (
    <div>
      {/* Busca textual */}
      <div className="mb-4">
        <Input
          label="Buscar Referência"
          placeholder="Digite o nome do medicamento de referência..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar medicamento de referência"
          autoComplete="off"
        />
      </div>

      {/* Barra de navegação A-Z (só aparece quando não há busca ativa) */}
      {!hasActiveSearch && (
        <div className="mb-4 overflow-x-auto" role="tablist" aria-label="Filtrar por letra inicial">
          <div className="flex gap-0.5 min-w-max">
            {ALPHABET.map(letter => (
              <button
                key={letter}
                type="button"
                role="tab"
                aria-selected={letterFilter === letter}
                onClick={() => toggleLetter(letter)}
                className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-sm transition-colors ${
                  letterFilter === letter
                    ? 'bg-brand-black text-white'
                    : 'text-muted hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {letter}
              </button>
            ))}
            <button
              type="button"
              role="tab"
              aria-selected={letterFilter === '#'}
              onClick={() => toggleLetter('#')}
              className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-sm transition-colors ${
                letterFilter === '#'
                  ? 'bg-brand-black text-white'
                  : 'text-muted hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              #
            </button>
          </div>
        </div>
      )}

      {/* Barra de info: contagem + ordenação */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap" aria-live="polite">
        <p className="text-xs text-muted">
          {hasActiveSearch && isStillSearching && (
            <>Buscando &ldquo;{query}&rdquo;...</>
          )}
          {hasSearchData && (
            <>{results.length} resultado{results.length !== 1 ? 's' : ''}</>
          )}
          {!hasActiveSearch && letterFilter && (
            <>{filteredCount} de {displayCount} referência{displayCount !== 1 ? 's' : ''} &mdash; letra {letterFilter}</>
          )}
          {!hasActiveSearch && !letterFilter && (
            <>{displayCount} referência{displayCount !== 1 ? 's' : ''} encontrada{displayCount !== 1 ? 's' : ''}</>
          )}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-references" className="text-xs text-muted">Ordenar:</label>
          <select
            id="sort-references"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-border rounded-sm bg-[var(--color-bg)] p-1 text-xs text-[var(--color-text)]"
          >
            <option value="count">Mais similares</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* Lista de referências */}
      <div className="space-y-3" role="list" aria-label="Lista de medicamentos de referência">
        {/* Estado: lista inicial (com ou sem filtro) — visível durante busca também para evitar flash */}
        {(!hasActiveSearch || isStillSearching) && paginatedRefs.length > 0 && (
          <>
            {/* Overlay sutil quando está buscando */}
            {isStillSearching && (
              <div className="mb-3 p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-sm text-xs text-muted flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                Buscando &ldquo;{query}&rdquo; — resultados aparecerão automaticamente
              </div>
            )}

            {paginatedRefs.map(ref => (
              <Link
                key={ref.name}
                href={`/referencias/${encodeURIComponent(ref.name)}`}
                className="block border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all group"
                role="listitem"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors">
                      {ref.name}
                    </span>
                    <p className="text-xs text-muted mt-0.5">
                      {ref.count} medicamento{ref.count !== 1 ? 's' : ''} similar{ref.count !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <Badge variant="primary" className="shrink-0">
                    {ref.count} similar{ref.count !== 1 ? 'es' : ''}
                  </Badge>
                </div>
              </Link>
            ))}
          </>
        )}

        {/* Estado: resultados da busca */}
        {hasSearchData && paginatedRefs.length > 0 && (
          paginatedRefs.map(ref => (
            <Link
              key={ref.name}
              href={`/referencias/${encodeURIComponent(ref.name)}`}
              className="block border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all group"
              role="listitem"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-sm text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors">
                    {ref.name}
                  </span>
                  <p className="text-xs text-muted mt-0.5">
                    {ref.count} medicamento{ref.count !== 1 ? 's' : ''} similar{ref.count !== 1 ? 'es' : ''}
                  </p>
                </div>
                <Badge variant="primary" className="shrink-0">
                  {ref.count} similar{ref.count !== 1 ? 'es' : ''}
                </Badge>
              </div>
            </Link>
          ))
        )}

        {/* Estado vazio da busca */}
        {isEmptySearch && (
          <div className="p-8 text-center" role="status">
            <p className="font-medium text-[var(--color-text)]">
              Nenhuma referência encontrada para &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-muted mt-1">
              Tente buscar por outro termo ou limpe a busca para ver todas as referências
            </p>
            <button
              type="button"
              onClick={() => { setQuery(''); setLetterFilter(null) }}
              className="mt-3 text-xs text-[var(--color-brand)] hover:underline"
            >
              Limpar busca
            </button>
          </div>
        )}

        {/* Estado vazio da lista inicial (com filtro A-Z) */}
        {!hasActiveSearch && filteredCount === 0 && letterFilter && (
          <div className="p-8 text-center" role="status">
            <p className="font-medium text-[var(--color-text)]">
              Nenhuma referência começando com &ldquo;{letterFilter}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => setLetterFilter(null)}
              className="mt-2 text-xs text-[var(--color-brand)] hover:underline"
            >
              Mostrar todas
            </button>
          </div>
        )}
      </div>

      {/* Paginação */}
      {filteredCount > PAGE_SIZE && (
        <div className="mt-4">
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            total={filteredCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            label="referência"
          />
        </div>
      )}
    </div>
  )
}
