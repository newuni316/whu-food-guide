'use client'

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { MapMarker } from "@/types"

const MapView = dynamic(() => import("@/components/map/map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-3">
        <Skeleton variant="rectangular" className="h-12 w-12 rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">地图加载中...</p>
      </div>
    </div>
  ),
})

export function MapPageClient({ markers }: { markers: MapMarker[] }) {
  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <MapView markers={markers} />
    </div>
  )
}
