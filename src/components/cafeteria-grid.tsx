import { getCanteens } from "@/lib/api"
import { RestaurantCard } from "@/components/cafeteria-card"
import type { CanteenWithRelations } from "@/types"

export async function CafeteriaGrid({
  cafeterias: initial,
}: {
  cafeterias?: CanteenWithRelations[]
}) {
  const cafeterias = initial || (await getCanteens())

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cafeterias.map((canteen) => (
        <RestaurantCard key={canteen.id} canteen={canteen} />
      ))}
    </div>
  )
}
