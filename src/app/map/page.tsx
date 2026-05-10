import dynamic from "next/dynamic"
import { prisma } from "@/lib/prisma"
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

export const metadata = {
  title: "美食地图",
  description: "武汉大学校园食堂地图 — 一目了然",
}

async function getMapMarkers(): Promise<MapMarker[]> {
  const canteens = await prisma.canteen.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      slug: true,
      avgRating: true,
      isOpen: true,
      campus: { select: { name: true } },
    },
  })

  return canteens.map((c) => ({
    id: c.id,
    name: c.name,
    latitude: c.latitude,
    longitude: c.longitude,
    campus: c.campus?.name || "",
    slug: c.slug,
    rating: c.avgRating,
    isOpen: c.isOpen,
  }))
}

export default async function MapPage() {
  const markers = await getMapMarkers()

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <MapView markers={markers} />
    </div>
  )
}
