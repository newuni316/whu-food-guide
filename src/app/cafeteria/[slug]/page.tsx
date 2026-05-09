import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Star, MapPin, Clock, DollarSign, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cafeteria = await prisma.cafeteria.findFirst({ where: { slug } })
  if (!cafeteria) return { title: "未找到" }
  return {
    title: cafeteria.name,
    description: `${cafeteria.name} — 武汉大学智慧校园美食平台`,
  }
}

export default async function CafeteriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cafeteria = await prisma.cafeteria.findFirst({
    where: { slug, deletedAt: null },
    include: {
      stalls: {
        where: { deletedAt: null },
        include: { dishes: true },
      },
    },
  })

  if (!cafeteria) notFound()

  const rating = cafeteria.rating as { taste: number; environment: number; value: number } | null
  const avgRating = rating
    ? ((rating.taste + rating.environment + rating.value) / 3).toFixed(1)
    : "0"

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{cafeteria.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {cafeteria.address}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {cafeteria.hours}
          </span>
          {rating && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {avgRating}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {(cafeteria.tags as string[])?.map((tag: string) => (
          <Badge key={tag} variant="secondary">{tag}</Badge>
        ))}
      </div>

      {cafeteria.review && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{cafeteria.review}</p>
        </div>
      )}

      <h2 className="mb-4 text-xl font-semibold">美食窗口</h2>
      <div className="space-y-4">
        {cafeteria.stalls.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无窗口信息</p>
        ) : (
          cafeteria.stalls.map((stall) => (
            <div
              key={stall.id}
              className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md"
            >
              <h3 className="text-lg font-semibold">{stall.name}</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(stall.category as string[])?.map((cat: string) => (
                  <Badge key={cat} variant="outline">{cat}</Badge>
                ))}
              </div>
              {stall.dishes.length > 0 && (
                <div className="mt-3 space-y-1">
                  {stall.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-secondary transition-colors"
                    >
                      <span className="text-sm">{dish.name}</span>
                      {dish.price && (
                        <span className="text-sm font-medium text-primary">
                          ¥{dish.price.toFixed(0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
