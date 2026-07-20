import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Skeleton className="h-6 w-32 mx-auto mb-4" />
          <Skeleton className="h-12 w-80 mx-auto mb-3" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="mt-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}
