import { getDashboardStats } from '@/lib/actions/search'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Estatísticas consolidadas da base de medicamentos ANVISA. Filtros por ano, categoria e situação.",
  openGraph: {
    title: "Dashboard — Unificando Med",
    description: "Estatísticas consolidadas da base de medicamentos ANVISA.",
  },
}

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
      <div className="grid md:grid-cols-4 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-6">
            Estatísticas
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            Dashboard
          </h1>
          <p className="mt-2 text-base text-muted">
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
