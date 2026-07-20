import { getDashboardStats } from '@/lib/actions/search'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'
import { Suspense } from 'react'

async function DashboardStats() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-12">
      <DashboardFilters
        availableYears={stats.availableYears}
        categories={stats.categories.map(c => c.name)}
        initialStats={{
          totalMedicines: stats.totalMedicines,
          totalReferences: stats.totalReferences,
          ativoCount: stats.ativoCount,
          inativoCount: stats.inativoCount,
          topReferences: stats.topReferences,
          topActiveIngredients: stats.topActiveIngredients,
          categories: stats.categories,
          timeline: stats.timeline,
          availableYears: stats.availableYears,
        }}
      />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-4 gap-8">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-6">
            ESTATÍSTICAS
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black">
            Dashboard
          </h1>
          <p className="mt-4 text-sm font-mono font-bold uppercase text-brutalist-black">
            Dados consolidados da ANVISA
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardStats />
        </Suspense>
      </div>
    </section>
  )
}
