import { Suspense } from 'react'
import { getReferenceMedicines } from '@/lib/actions/references'
import { ReferenceSearch } from '@/components/medicines/reference-search'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { safeJsonLd } from '@/lib/safe-json-ld'
import { SITE } from '@/lib/config'
import type { ReferenceItem } from '@/components/medicines/reference-search'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Medicamentos de Referência e Similares",
  description: "Consulte todos os medicamentos de referência e seus similares conforme lista ANVISA.",
  alternates: { canonical: "/referencias" },
  openGraph: {
    title: "Medicamentos de Referência e Similares — Med Unificando",
    description: "Consulte medicamentos de referência e seus similares ANVISA.",
  },
}

async function ReferenceSearchContainer() {
  const refs = await getReferenceMedicines()
  const items: ReferenceItem[] = refs.map((r: { name: string; count: number }) => ({
    name: r.name,
    count: r.count,
  }))

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Medicamentos de Referência',
    itemListElement: refs.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: r.name,
      url: `${SITE.BASE_URL}/referencias/${encodeURIComponent(r.name)}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }}
      />
      <ReferenceSearch initialReferences={items} />
    </>
  )
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

        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }>
          <ReferenceSearchContainer />
        </Suspense>
      </div>
    </section>
  )
}
