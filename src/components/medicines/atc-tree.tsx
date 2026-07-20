'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface AtcLevelItem {
  code: string
  count: number
}

interface AtcTreeProps {
  level1: AtcLevelItem[]
  level2: AtcLevelItem[]
  level3: AtcLevelItem[]
}

export function AtcTree({ level1, level2, level3 }: AtcTreeProps) {
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const isSearching = term.length > 0

  const filteredLevel1 = useMemo(
    () => level1.filter(l => l.code.toLowerCase().includes(term)),
    [level1, term]
  )
  const filteredLevel2 = useMemo(
    () => level2.filter(l => l.code.toLowerCase().includes(term)),
    [level2, term]
  )
  const filteredLevel3 = useMemo(
    () => level3.filter(l => l.code.toLowerCase().includes(term)),
    [level3, term]
  )

  const visibleLevel2 = isSearching ? filteredLevel2 : filteredLevel2.slice(0, 40)
  const visibleLevel3 = isSearching ? filteredLevel3 : filteredLevel3.slice(0, 40)

  return (
    <div className="space-y-10">
      <Input
        label="Buscar Código ATC"
        placeholder="Ex: A10, C09AA, N02BE01..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <section>
        <Badge variant="primary" className="mb-4">Nível 1 — Anatômico</Badge>
        {filteredLevel1.length === 0 ? (
          <p className="text-sm text-muted">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLevel1.map(l => (
              <Link
                key={l.code}
                href={`/atc/${l.code}`}
                className="border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all"
              >
                <span className="font-semibold text-lg text-[var(--color-text)]">{l.code}</span>
                <span className="ml-2 text-xs text-muted">{l.count} código{l.count !== 1 ? 's' : ''}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <Badge variant="primary" className="mb-4">Nível 2 — Terapêutico</Badge>
        {visibleLevel2.length === 0 ? (
          <p className="text-sm text-muted">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-2">
            {visibleLevel2.map(l => (
              <Link
                key={l.code}
                href={`/atc/${l.code}`}
                className="border border-border rounded-sm bg-[var(--color-bg)] p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all text-sm font-medium text-[var(--color-text)]"
              >
                {l.code} <span className="text-muted ml-1">({l.count})</span>
              </Link>
            ))}
          </div>
        )}
        {!isSearching && filteredLevel2.length > 40 && (
          <p className="text-xs text-muted mt-2">
            + {filteredLevel2.length - 40} código{filteredLevel2.length - 40 !== 1 ? 's' : ''} de nível 2 — use a busca para encontrar
          </p>
        )}
      </section>

      <section>
        <Badge variant="primary" className="mb-4">Nível 3 — Químico</Badge>
        {visibleLevel3.length === 0 ? (
          <p className="text-sm text-muted">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-2">
            {visibleLevel3.map(l => (
              <Link
                key={l.code}
                href={`/atc/${l.code}`}
                className="border border-border rounded-sm bg-[var(--color-bg)] p-2 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all text-xs font-medium text-[var(--color-text)]"
              >
                {l.code} <span className="text-muted">({l.count})</span>
              </Link>
            ))}
          </div>
        )}
        {!isSearching && filteredLevel3.length > 40 && (
          <p className="text-xs text-muted mt-2">
            + {filteredLevel3.length - 40} código{filteredLevel3.length - 40 !== 1 ? 's' : ''} de nível 3 — use a busca para encontrar
          </p>
        )}
      </section>
    </div>
  )
}
