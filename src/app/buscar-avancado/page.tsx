import { Suspense } from 'react'
import { searchMedicines } from '@/lib/actions/search'
import { SearchForm } from '@/components/medicines/search-form'
import { MedicineTable } from '@/components/medicines/medicine-table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Busca Avançada",
  description: "Filtre por referência, princípio ativo, nome comercial ou categoria e navegue pela base completa de medicamentos ANVISA.",
  openGraph: {
    title: "Busca Avançada — Med Unificando",
    description: "Filtre e navegue pela base completa de medicamentos intercambiáveis ANVISA.",
  },
}

export default async function BuscaAvancadaPage() {
  const initialData = await searchMedicines(1, 10)

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-6">
            Busca Avançada
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-[var(--color-text)]">
            Medicamentos
            <br />
            Intercambiáveis
          </h1>
          <p className="mt-4 text-base text-muted max-w-2xl mx-auto">
            Filtre por referência, princípio ativo, nome comercial ou categoria
            e navegue pela base completa
          </p>
        </div>

        <Suspense fallback={<div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6 md:p-8"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>}>
          <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6 md:p-8">
            <SearchForm />
            <div className="mt-8">
              <MedicineTable initialData={initialData} />
            </div>
          </div>
        </Suspense>
      </div>
    </section>
  )
}
