'use client'

import { useState } from 'react'
import { semanticSearch } from '@/lib/actions/semantic-search'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SemanticResultsTable } from '@/components/medicines/semantic-results-table'
import { useRecentSearches } from '@/hooks/use-recent-searches'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

export function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ score: number; medicine: MedicineResult }[]>([])
  const [searched, setSearched] = useState(false)
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const { recent, add: addRecent } = useRecentSearches()

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query
    if (!searchQuery.trim()) return
    setLoading(true)
    setSearched(true)
    setQuery(searchQuery)
    addRecent(searchQuery)

    try {
      const data = await semanticSearch(query, 20)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="primary">BUSCA SEMÂNTICA</Badge>
        <span className="text-xs text-muted">
          IA local — descreva o medicamento
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label=""
            placeholder='Ex: "anti-inflamatório para articulação" ou "remédio para pressão"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            aria-describedby="search-description"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="self-end"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {!searched && recent.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">Buscas recentes:</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSearch(r)}
                className="text-xs px-2.5 py-1 rounded-sm border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      <p id="search-description" className="sr-only">
        Digite uma descrição do medicamento para buscar semanticamente
      </p>

      {loading && (
        <div className="mt-6 space-y-3" aria-live="polite" aria-label="Carregando resultados">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs text-muted">
              Resultados por relevância semântica
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={view === 'cards' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('cards')}
              >
                Cards
              </Button>
              <Button
                type="button"
                variant={view === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                Tabela
              </Button>
            </div>
          </div>

          {view === 'cards' ? (
            <div className="space-y-2" aria-live="polite" role="list">
              {results.map(r => (
                <Link
                  key={r.medicine.id}
                  href={`/medicamento/${r.medicine.id}`}
                  className="block border border-border rounded-sm p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-colors"
                  role="listitem"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-sm text-[var(--color-text)]">{r.medicine.tradeName}</span>
                      <p className="text-xs text-muted mt-0.5 truncate">{r.medicine.activeIngredient}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.medicine.category && <Badge variant="primary">{r.medicine.category}</Badge>}
                      {r.medicine.status === 'Ativo' && (
                        <span className="text-[11px] font-medium text-success">Ativo</span>
                      )}
                      <span className="text-xs text-muted">
                        {(r.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-1 truncate">{r.medicine.similarHolder}</p>
                </Link>
              ))}
            </div>
          ) : (
            <SemanticResultsTable results={results} />
          )}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="mt-4 text-sm text-muted" role="status">
          Nenhum resultado encontrado. Tente descrever de outra forma.
        </p>
      )}
    </div>
  )
}
