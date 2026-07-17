import { Suspense } from 'react'
import { getAtcLevels } from '@/lib/actions/atc'
import { AtcTree } from '@/components/medicines/atc-tree'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

async function AtcTreeContainer() {
  const levels = await getAtcLevels()
  return <AtcTree level1={levels.level1} level2={levels.level2} level3={levels.level3} />
}

export default function AtcPage() {
  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <Badge variant="secondary" className="mb-4">CLASSIFICAÇÃO ATC</Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black">
            Navegar por Código ATC
          </h1>
          <p className="mt-4 text-sm font-mono font-bold uppercase text-brutalist-black">
            Explore medicamentos por classificação Anatômica, Terapêutica e Química
          </p>
        </div>

        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-96 w-full" /></div>}>
          <AtcTreeContainer />
        </Suspense>
      </div>
    </section>
  )
}
