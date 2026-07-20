import { Suspense } from 'react'
import { CompareView } from '@/components/medicines/compare-view'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Comparar Medicamentos",
  description: "Compare medicamentos lado a lado. Veja diferenças em referência, princípio ativo, categoria e mais.",
  openGraph: {
    title: "Comparar Medicamentos — Med Unificando",
    description: "Compare medicamentos lado a lado.",
  },
}

export default function ComparePage() {
  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)] min-h-screen">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-12 w-48 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <CompareView />
      </Suspense>
    </section>
  )
}
