import { Suspense } from 'react'
import { getCachedAtcLevels } from '@/lib/data-cache'
import { AtcTree } from '@/components/medicines/atc-tree'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { safeJsonLd } from '@/lib/safe-json-ld'
import { SITE } from '@/lib/config'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Classificação ATC de Medicamentos ANVISA",
  description: "Explore medicamentos por classificação Anatômica, Terapêutica e Química (ATC). Navegue pela árvore de códigos ATC.",
  alternates: { canonical: "/atc" },
  openGraph: {
    title: "Classificação ATC de Medicamentos ANVISA",
    description: "Explore medicamentos por classificação Anatômica, Terapêutica e Química.",
  },
}

async function AtcTreeContainer() {
  const levels = await getCachedAtcLevels()

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Classificação ATC',
    itemListElement: levels.level1.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: l.code,
      url: `${SITE.BASE_URL}/atc/${l.code}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }}
      />
      <AtcTree level1={levels.level1} level2={levels.level2} level3={levels.level3} />
    </>
  )
}

export default function AtcPage() {
  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <Badge variant="primary" className="mb-4">Classificação ATC</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            Navegar por Código ATC
          </h1>
          <p className="mt-2 text-base text-muted">
            Explore medicamentos por classificação Anatômica, Terapêutica e Química
          </p>
        </div>

        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-96 w-full" /></div>}>
          <AtcTreeContainer />
        </Suspense>
      </div>
    </section>
  )
}
