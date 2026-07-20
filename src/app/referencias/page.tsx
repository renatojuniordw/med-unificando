import { Suspense } from 'react'
import { getReferenceMedicines } from '@/lib/actions/references'
import { ReferenceSearch } from '@/components/medicines/reference-search'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReferenceItem } from '@/components/medicines/reference-search'

async function ReferenceSearchContainer() {
  const refs = await getReferenceMedicines()
  const items: ReferenceItem[] = refs.map((r: { name: string; count: number }) => ({
    name: r.name,
    count: r.count,
  }))
  return <ReferenceSearch initialReferences={items} />
}

export default function ReferenciasPage() {
  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <Badge variant="primary" className="mb-4">Referências</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            Medicamentos de Referência
          </h1>
          <p className="mt-2 text-base text-muted">
            Consulte todos os medicamentos de referência e seus similares
          </p>
        </div>

        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-96 w-full" /></div>}>
          <ReferenceSearchContainer />
        </Suspense>
      </div>
    </section>
  )
}
