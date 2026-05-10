"use client"

import { cn } from "@/lib/utils"
import { Star, MapPin, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { CanteenWithRelations } from "@/types"

interface RestaurantCardProps {
  canteen: CanteenWithRelations
}

function formatHours(hours: unknown): string {
  if (!hours || typeof hours !== "object") return "营业时间未知"
  const h = hours as Record<string, { open: string; close: string }>
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()
  const todayHours = h[today] || h["mon"]
  if (!todayHours) return "营业时间未知"
  return `${todayHours.open}-${todayHours.close}`
}

function getPriceRange(canteen: CanteenWithRelations): string {
  const windows = canteen.windows || []
  if (windows.length === 0) return ""
  const mins = windows.map((w) => w.priceMin)
  const maxs = windows.map((w) => w.priceMax)
  const min = Math.min(...mins)
  const max = Math.max(...maxs)
  if (min === max) return `¥${min}`
  return `¥${min}-${max}`
}

function getQueueColor(index: number): string {
  if (index < 40) return "text-success"
  if (index < 70) return "text-warning"
  return "text-destructive"
}

export function RestaurantCard({ canteen }: RestaurantCardProps) {
  const priceRange = getPriceRange(canteen)
  const hours = formatHours(canteen.hours)
  const topDishes = canteen.windows
    ?.flatMap((w) => w.dishes || [])
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 3) || []

  return (
    <Link href={`/cafeteria/${canteen.slug}`}>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {canteen.name}
              </h3>
              <p className="text-sm text-muted-foreground">{canteen.campus?.name}</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-sm font-semibold text-primary">
                {canteen.avgRating.toFixed(1)}
              </span>
            </div>
          </div>

          {canteen.tags && canteen.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {canteen.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {canteen.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{canteen.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {canteen.address}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hours}
            </span>
            {priceRange && (
              <span className="font-medium text-foreground">{priceRange}</span>
            )}
          </div>

          {canteen.queueIndex > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className={cn("text-xs font-medium", getQueueColor(canteen.queueIndex))}>
                排队指数 {canteen.queueIndex}%
              </span>
            </div>
          )}

          {topDishes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">招牌：</span>
              {topDishes.map((d) => (
                <span key={d.id} className="rounded-md bg-secondary px-1.5 py-0.5">
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
