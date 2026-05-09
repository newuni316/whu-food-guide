"use client"

import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { Star, MapPin, Clock, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export interface RestaurantCardProps {
  id: string
  name: string
  slug: string
  campus: string
  area: string
  category: string[]
  priceRange: number[]
  rating: { taste: number; environment: number; value: number }
  address: string
  hours: string
  tags: string[]
  recommendations: string[]
}

export function RestaurantCard({
  name,
  slug,
  campus,
  area,
  category,
  priceRange,
  rating,
  address,
  hours,
  tags,
  recommendations,
}: RestaurantCardProps) {
  const avgRating = ((rating.taste + rating.environment + rating.value) / 3).toFixed(1)

  return (
    <Link href={`/cafeteria/${slug}`}>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">{area}</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-sm font-semibold text-primary">{avgRating}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {category.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {address}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hours}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {priceRange[0]}-{priceRange[1]}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">推荐：</span>
              {recommendations.slice(0, 2).map((r) => (
                <span key={r} className="rounded-md bg-secondary px-1.5 py-0.5">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
