import { Skeleton } from "@/components/ui/skeleton"

export default function CafeteriaDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-3">
            <Skeleton className="h-9 w-48" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tags skeleton */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>

      {/* Queue skeleton */}
      <div className="mb-8 rounded-xl border p-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Windows skeleton */}
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between p-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
