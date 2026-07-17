import { Suspense } from 'react'
import { CompareView } from '@/components/medicines/compare-view'
import { Skeleton } from '@/components/ui/skeleton'

export default function ComparePage() {
  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-12 w-48 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <CompareView />
      </Suspense>
    </section>
  )
}
