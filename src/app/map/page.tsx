import { prisma } from "@/lib/prisma"
import { MapPageClient } from "@/components/map/map-page-client"
import type { MapMarker } from "@/types"

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

  return <MapPageClient markers={markers} />
}
