import { Suspense } from 'react'
import { getReferenceMedicines } from '@/lib/actions/references'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

async function ReferenceList() {
  const references = await getReferenceMedicines()

  return (
    <div className="space-y-3">
      {references.length === 0 ? (
        <p className="font-bold uppercase text-sm">Nenhum medicamento de referência encontrado.</p>
      ) : (
        references.map(ref => (
          <Link
            key={ref.name}
            href={`/referencias/${encodeURIComponent(ref.name)}`}
            className="block border-4 border-brutalist-black bg-white p-4 hover:bg-neon-yellow hover:-translate-y-1 hover:shadow-hard-lg transition-all"
          >
            <div className="flex justify-between items-center">
              <span className="font-black uppercase tracking-tight">{ref.name}</span>
              <Badge variant="primary">{ref.count} similares</Badge>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

export default function ReferencesPage() {
  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <Badge variant="secondary" className="mb-4">REFERÊNCIAS</Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black">
            Medicamentos de Referência
          </h1>
          <p className="mt-4 text-sm font-mono font-bold uppercase text-brutalist-black">
            Explore os medicamentos de referência e seus similares intercambiáveis
          </p>
        </div>

        <Suspense fallback={<div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}>
          <ReferenceList />
        </Suspense>
      </div>
    </section>
  )
}
