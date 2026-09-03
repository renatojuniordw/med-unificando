import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { HolderContent } from '@/components/medicines/holder-content'
import { Skeleton } from '@/components/ui/skeleton'
import { getCachedHolderMedicines, getCachedHolderSummary } from '@/lib/data-cache'
import { MEDICINE_LIMITS } from '@/lib/constants'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ holder: string }> }): Promise<Metadata> {
  const { holder } = await params
  const decoded = decodeURIComponent(holder)
  return {
    title: `${decoded} — Detentor de Registro`,
    description: `Medicamentos do detentor de registro ${decoded}. Consulte todos os medicamentos e similares.`,
    alternates: { canonical: `/detentor/${holder}` },
    openGraph: {
      title: `${decoded} — Detentor de Registro | Med Unificando`,
      description: `Medicamentos do detentor de registro ${decoded}.`,
    },
  }
}

export default async function HolderPage({ params }: { params: Promise<{ holder: string }> }) {
  const { holder } = await params
  const decoded = decodeURIComponent(holder)

  const [{ data, total }, summary] = await Promise.all([
    getCachedHolderMedicines(decoded, 1, MEDICINE_LIMITS.HOLDER_PAGE_SIZE),
    getCachedHolderSummary(decoded),
  ])

  if (data.length === 0) notFound()

  const { holderName, total: totalMedicines, ativos: totalAtivos, categoriasCount } = summary

  const initialData = {
    data,
    total,
    page: 1,
    pageSize: MEDICINE_LIMITS.HOLDER_PAGE_SIZE,
  }

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[
          { label: 'Medicamentos', href: '/' },
          { label: holderName },
        ]} />

        <div className="mb-10">
          <Badge variant="primary" className="mb-4">Detentor</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--color-text)]">
            {holderName}
          </h1>
          <Suspense fallback={<div className="mt-6"><Skeleton className="h-24 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>}>
            <HolderContent
              holder={decoded}
              initialData={initialData}
              totalMedicines={totalMedicines}
              ativos={totalAtivos}
              categoriasCount={categoriasCount}
            />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
