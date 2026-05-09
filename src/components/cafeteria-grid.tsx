import { getCafeterias } from "@/lib/api"
import { RestaurantCard } from "@/components/cafeteria-card"

export async function CafeteriaGrid({ cafeterias: initial }: { cafeterias?: any[] }) {
  const cafeterias = initial || (await getCafeterias())

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cafeterias.map((cafeteria: any) => (
        <RestaurantCard
          key={cafeteria.id}
          id={cafeteria.id}
          name={cafeteria.name}
          slug={cafeteria.slug}
          campus={cafeteria.campus}
          area={cafeteria.area}
          category={cafeteria.category || []}
          priceRange={cafeteria.priceRange || [0, 0]}
          rating={cafeteria.rating || { taste: 0, environment: 0, value: 0 }}
          address={cafeteria.address || ""}
          hours={cafeteria.hours || ""}
          tags={cafeteria.tags || []}
          recommendations={cafeteria.recommendations || []}
        />
      ))}
    </div>
  )
}
