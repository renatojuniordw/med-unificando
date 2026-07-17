import { Suspense } from 'react'
import { getReferenceMedicines } from '@/lib/actions/references'
import { ReferenceSearch } from '@/components/medicines/reference-search'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

async function ReferenceList() {
  const references = await getReferenceMedicines()
  return <ReferenceSearch initialReferences={references} />
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
