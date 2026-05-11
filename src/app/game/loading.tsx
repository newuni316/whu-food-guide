import { Skeleton } from "@/components/ui/skeleton"

export default function GameLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      <div className="flex justify-center mb-8">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>

      <Skeleton className="h-24 rounded-xl" />
    </div>
  )
}
