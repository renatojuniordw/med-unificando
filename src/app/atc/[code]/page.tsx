import { getCachedAtcMedicines } from '@/lib/data-cache'
import { AtcCodeContent } from '@/components/medicines/atc-code-content'
import { Skeleton } from '@/components/ui/skeleton'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const decoded = decodeURIComponent(code).toUpperCase()
  return {
    title: `ATC ${decoded}`,
    description: `Medicamentos com classificação ATC ${decoded}. Veja todos os medicamentos deste código.`,
    alternates: { canonical: `/atc/${code}` },
    openGraph: {
      title: `ATC ${decoded} — Med Unificando`,
      description: `Medicamentos com classificação ATC ${decoded}.`,
    },
  }
}

export default async function AtcCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const decoded = decodeURIComponent(code).toUpperCase()
  const initialData = await getCachedAtcMedicines(decoded, 1, 20)

  if (initialData.data.length === 0) notFound()

  return (
    <Suspense fallback={<div className="py-12 md:py-20 bg-[var(--color-bg)]"><div className="max-w-5xl mx-auto px-6 lg:px-12"><Skeleton className="h-8 w-40 mb-6" /><Skeleton className="h-12 w-32 mb-4" /><Skeleton className="h-64 w-full" /></div></div>}>
      <AtcCodeContent code={decoded} initialData={initialData} />
    </Suspense>
  )
}
