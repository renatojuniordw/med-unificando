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
        label="BUSCAR CÓDIGO ATC"
        placeholder="Ex: A10, C09AA, N02BE01..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <section>
        <Badge variant="secondary" className="mb-4">NÍVEL 1 — ANATÔMICO</Badge>
        {filteredLevel1.length === 0 ? (
          <p className="text-xs font-mono text-slate-500">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLevel1.map(l => (
              <Link
                key={l.code}
                href={`/atc/${l.code}`}
                className="border-4 border-brutalist-black bg-white p-4 hover:bg-neon-yellow hover:-translate-y-1 hover:shadow-hard-lg transition-all"
              >
                <span className="font-black uppercase text-lg">{l.code}</span>
                <span className="ml-2 text-xs font-mono text-slate-500">{l.count} códigos</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <Badge variant="secondary" className="mb-4">NÍVEL 2 — TERAPÊUTICO</Badge>
        {visibleLevel2.length === 0 ? (
          <p className="text-xs font-mono text-slate-500">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-2">
            {visibleLevel2.map(l => (
              <Link
                key={l.code}
                href={`/atc/${l.code}`}
                className="border-2 border-brutalist-black bg-white p-3 hover:bg-neon-yellow transition-all text-xs font-bold uppercase"
              >
                {l.code} <span className="text-slate-500 ml-1">({l.count})</span>
              </Link>
            ))}
          </div>
        )}
        {!isSearching && filteredLevel2.length > 40 && (
          <p className="text-xs font-mono text-slate-500 col-span-full mt-2">
            + {filteredLevel2.length - 40} códigos de nível 2 — use a busca para encontrar
          </p>
        )}
      </section>

      <section>
        <Badge variant="secondary" className="mb-4">NÍVEL 3 — QUÍMICO</Badge>
        {visibleLevel3.length === 0 ? (
          <p className="text-xs font-mono text-slate-500">Nenhum código encontrado.</p>
        ) : (
          <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-2">
            {visibleLevel3.map(l => (
              <Link
                key={l.code}
                href={`/atc/${l.code}`}
                className="border-2 border-brutalist-black bg-white p-2 hover:bg-neon-yellow transition-all text-[10px] font-bold uppercase"
              >
                {l.code} <span className="text-slate-500">({l.count})</span>
              </Link>
            ))}
          </div>
        )}
        {!isSearching && filteredLevel3.length > 40 && (
          <p className="text-xs font-mono text-slate-500 col-span-full mt-2">
            + {filteredLevel3.length - 40} códigos de nível 3 — use a busca para encontrar
          </p>
        )}
      </section>
    </div>
  )
}
