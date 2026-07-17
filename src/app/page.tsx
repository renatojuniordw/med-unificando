import { Suspense } from 'react'
import { searchMedicines, getDistinctValues } from '@/lib/actions/search'
import { SearchForm } from '@/components/medicines/search-form'
import { MedicineTable } from '@/components/medicines/medicine-table'
import { SemanticSearch } from '@/components/medicines/semantic-search'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default async function HomePage() {
  const initialData = await searchMedicines(1, 10)
  const [references, activeIngredients, tradeNames, categories] = await Promise.all([
    getDistinctValues('reference'),
    getDistinctValues('activeIngredient'),
    getDistinctValues('tradeName'),
    getDistinctValues('category'),
  ])

  return (
    <section className="py-12 md:py-20 bg-neon-yellow border-b-8 border-brutalist-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-6">
            LISTA ANVISA
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-brutalist-black">
            Medicamentos
            <br />
            Intercambiáveis
          </h1>
          <p className="mt-6 text-sm font-mono font-bold uppercase text-brutalist-black max-w-2xl mx-auto">
            Consulte medicamentos similares e seus respectivos medicamentos de
            referência conforme dados abertos ANVISA
          </p>
        </div>

        <Suspense fallback={<div className="bg-white border-8 border-brutalist-black shadow-hard-lg p-6 md:p-10"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>}>
          <div className="bg-white border-8 border-brutalist-black shadow-hard-lg p-6 md:p-10">
            <SemanticSearch />
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
