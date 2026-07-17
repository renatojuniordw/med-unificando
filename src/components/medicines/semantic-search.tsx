'use client'

import { useState } from 'react'
import { semanticSearch } from '@/lib/actions/semantic-search'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SemanticResultsTable } from '@/components/medicines/semantic-results-table'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

export function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ score: number; medicine: MedicineResult }[]>([])
  const [searched, setSearched] = useState(false)
  const [view, setView] = useState<'cards' | 'table'>('cards')

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

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
    <div className="border-4 md:border-8 border-brutalist-black bg-white shadow-hard-lg p-6 md:p-10">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">BUSCA SEMÂNTICA</Badge>
        <span className="text-[9px] font-mono text-slate-400">
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
          />
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="self-end"
        >
          {loading ? 'PENSANDO...' : 'BUSCAR'}
        </Button>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 border-t-4 border-brutalist-black pt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[10px] font-mono font-bold text-slate-500">
              Resultados por relevância semântica
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={view === 'cards' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('cards')}
              >
                CARDS
              </Button>
              <Button
                type="button"
                variant={view === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                TABELA
              </Button>
            </div>
          </div>

          {view === 'cards' ? (
            <div className="space-y-2">
              {results.map(r => (
                <Link
                  key={r.medicine.id}
                  href={`/medicamento/${r.medicine.id}`}
                  className="block border-2 border-brutalist-black p-3 hover:bg-neon-yellow transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-black uppercase text-sm">{r.medicine.tradeName}</span>
                      <p className="text-[10px] font-mono text-slate-600 truncate">{r.medicine.activeIngredient}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.medicine.category && <Badge variant="primary">{r.medicine.category}</Badge>}
                      {r.medicine.status === 'Ativo' && <span className="text-[9px] font-black text-success-green">ATIVO</span>}
                      <span className="text-[9px] font-mono text-slate-400">
                        {(r.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 mt-1 truncate">{r.medicine.similarHolder}</p>
                </Link>
              ))}
            </div>
          ) : (
            <SemanticResultsTable results={results} />
          )}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="mt-4 text-sm font-mono text-slate-500">
          Nenhum resultado encontrado. Tente descrever de outra forma.
        </p>
      )}
    </div>
  )
}
