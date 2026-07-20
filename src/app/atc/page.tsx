import { Suspense } from 'react'
import { getAtcLevels } from '@/lib/actions/atc'
import { AtcTree } from '@/components/medicines/atc-tree'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Classificação ATC",
  description: "Explore medicamentos por classificação Anatômica, Terapêutica e Química (ATC). Navegue pela árvore de códigos ATC.",
  openGraph: {
    title: "Classificação ATC — Unificando Med",
    description: "Explore medicamentos por classificação Anatômica, Terapêutica e Química.",
  },
}

async function AtcTreeContainer() {
  const levels = await getAtcLevels()
  return <AtcTree level1={levels.level1} level2={levels.level2} level3={levels.level3} />
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
