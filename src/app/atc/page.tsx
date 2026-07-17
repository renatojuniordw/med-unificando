import { Suspense } from 'react'
import { getAtcLevels } from '@/lib/actions/atc'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

async function AtcTree() {
  const levels = await getAtcLevels()

  return (
    <div className="space-y-10">
      <section>
        <Badge variant="secondary" className="mb-4">NÍVEL 1 — ANATÔMICO</Badge>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {levels.level1.map(l => (
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
      </section>

      <section>
        <Badge variant="secondary" className="mb-4">NÍVEL 2 — TERAPÊUTICO</Badge>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-2">
          {levels.level2.slice(0, 40).map(l => (
            <Link
              key={l.code}
              href={`/atc/${l.code}`}
              className="border-2 border-brutalist-black bg-white p-3 hover:bg-neon-yellow transition-all text-xs font-bold uppercase"
            >
              {l.code} <span className="text-slate-500 ml-1">({l.count})</span>
            </Link>
          ))}
          {levels.level2.length > 40 && (
            <p className="text-xs font-mono text-slate-500 col-span-full mt-2">
              + {levels.level2.length - 40} códigos de nível 2
            </p>
          )}
        </div>
      </section>

      <section>
        <Badge variant="secondary" className="mb-4">NÍVEL 3 — QUÍMICO</Badge>
        <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-2">
          {levels.level3.slice(0, 40).map(l => (
            <Link
              key={l.code}
              href={`/atc/${l.code}`}
              className="border-2 border-brutalist-black bg-white p-2 hover:bg-neon-yellow transition-all text-[10px] font-bold uppercase"
            >
              {l.code} <span className="text-slate-500">({l.count})</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function AtcPage() {
  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <Badge variant="secondary" className="mb-4">CLASSIFICAÇÃO ATC</Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black">
            Navegar por Código ATC
          </h1>
          <p className="mt-4 text-sm font-mono font-bold uppercase text-brutalist-black">
            Explore medicamentos por classificação Anatômica, Terapêutica e Química
          </p>
        </div>

        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-96 w-full" /></div>}>
          <AtcTree />
        </Suspense>
      </div>
    </section>
  )
}
