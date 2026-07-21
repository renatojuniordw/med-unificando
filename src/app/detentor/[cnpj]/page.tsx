import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { HolderContent } from '@/components/medicines/holder-content'
import { getHolderMedicines } from '@/lib/actions/search'
import { MEDICINE_LIMITS } from '@/lib/constants'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ cnpj: string }> }): Promise<Metadata> {
  const { cnpj } = await params
  const decoded = decodeURIComponent(cnpj)
  return {
    title: `${decoded} — Detentor de Registro`,
    description: `Medicamentos do detentor de registro ${decoded}. Consulte todos os medicamentos e similares.`,
    openGraph: {
      title: `${decoded} — Detentor de Registro | Med Unificando`,
      description: `Medicamentos do detentor de registro ${decoded}.`,
    },
  }
}

export default async function HolderPage({ params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj } = await params
  const decoded = decodeURIComponent(cnpj)

  const all = await getHolderMedicines(decoded, 1, MEDICINE_LIMITS.MAX_HOLDER_RESULTS)

  if (all.data.length === 0) notFound()

  const holderName = all.data[0].similarHolder
  const totalAtivos = all.data.filter(m => m.status === 'Ativo').length
  const totalCategorias = new Set(all.data.map(m => m.category).filter(Boolean)).size

  const initialData = {
    ...all,
    data: all.data.slice(0, MEDICINE_LIMITS.HOLDER_PAGE_SIZE),
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
          <HolderContent
            holder={decoded}
            initialData={initialData}
            totalMedicines={all.total}
            ativos={totalAtivos}
            categoriasCount={totalCategorias}
          />
        </div>
      </div>
    </section>
  )
}
