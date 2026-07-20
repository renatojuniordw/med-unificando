import { Suspense } from 'react'
import { searchMedicines, getDistinctValues } from '@/lib/actions/search'
import { SearchForm } from '@/components/medicines/search-form'
import { MedicineTable } from '@/components/medicines/medicine-table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default async function BuscaAvancadaPage() {
  const initialData = await searchMedicines(1, 10)
  const [references, activeIngredients, tradeNames, categories] = await Promise.all([
    getDistinctValues('reference'),
    getDistinctValues('activeIngredient'),
    getDistinctValues('tradeName'),
    getDistinctValues('category'),
  ])

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
            <SearchForm
              references={references}
              activeIngredients={activeIngredients}
              tradeNames={tradeNames}
              categories={categories}
            />
            <div className="mt-8">
              <MedicineTable initialData={initialData} />
            </div>
          </div>
        </Suspense>
      </div>
    </section>
  )
}
