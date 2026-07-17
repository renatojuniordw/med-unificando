import { getDashboardStats } from '@/lib/actions/search'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

async function DashboardStats() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-4 gap-8">
        <Card>
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">
            TOTAL DE MEDICAMENTOS
          </p>
          <p className="text-5xl font-black tracking-tighter text-brutalist-black">
            {stats.totalMedicines.toLocaleString()}
          </p>
        </Card>

        <Card>
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">
            MEDICAMENTOS DISTINTOS
          </p>
          <p className="text-5xl font-black tracking-tighter text-brutalist-black">
            {stats.totalReferences.toLocaleString()}
          </p>
        </Card>

        <Card variant="active">
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">
            ATIVOS
          </p>
          <p className="text-5xl font-black tracking-tighter text-success-green">
            {stats.ativoCount.toLocaleString()}
          </p>
        </Card>

        <Card variant="inactive">
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">
            INATIVOS
          </p>
          <p className="text-5xl font-black tracking-tighter text-error-red">
            {stats.inativoCount.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8">
          <Badge variant="secondary" className="mb-4">
            TOP 10 MEDICAMENTOS
          </Badge>
          <div className="space-y-2">
            {stats.topReferences.map((item) => {
              const maxCount = stats.topReferences[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span className="truncate mr-2">{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-6 border-2 border-brutalist-black bg-white">
                    <div
                      className="h-full bg-neon-yellow border-r-2 border-brutalist-black"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8">
          <Badge variant="secondary" className="mb-4">
            TOP 10 PRINCÍPIOS ATIVOS
          </Badge>
          <div className="space-y-2">
            {stats.topActiveIngredients.map((item) => {
              const maxCount = stats.topActiveIngredients[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span className="truncate mr-2">{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-6 border-2 border-brutalist-black bg-white">
                    <div
                      className="h-full bg-brutalist-black border-r-2 border-brutalist-black"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8">
          <Badge variant="secondary" className="mb-4">
            CATEGORIAS
          </Badge>
          <div className="space-y-2">
            {stats.categories.map((item) => {
              const maxCount = stats.categories[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span className="truncate mr-2">{item.name || 'Sem categoria'}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-6 border-2 border-brutalist-black bg-white">
                    <div className="h-full bg-neon-yellow border-r-2 border-brutalist-black" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8">
        <Badge variant="secondary" className="mb-4">
          TIMELINE — REGISTROS POR ANO
        </Badge>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {stats.timeline.map((item) => {
            const maxCount = stats.timeline[0]?.count || 1
            const width = (item.count / maxCount) * 100
            return (
              <div key={item.year}>
                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                  <span>{item.year}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-4 border-2 border-brutalist-black bg-white">
                  <div className="h-full bg-brutalist-black" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
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
