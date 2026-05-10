import { getCanteenBySlug } from "@/lib/api"
import { notFound } from "next/navigation"
import { Star, MapPin, Clock, Phone, Tag, Users, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import { MotionWrapper } from "@/components/motion-wrapper"
import { cn } from "@/lib/utils"
import Link from "next/link"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const canteen = await getCanteenBySlug(slug)
  if (!canteen) return { title: "未找到" }
  return {
    title: canteen.name,
    description: `${canteen.name} — 武汉大学智慧校园美食平台`,
  }
}

function formatHours(hours: unknown): string {
  if (!hours || typeof hours !== "object") return ""
  const h = hours as Record<string, { open: string; close: string }>
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()
  const todayHours = h[today] || h["mon"]
  if (!todayHours) return ""
  return `${todayHours.open}-${todayHours.close}`
}

function getQueueVariant(index: number): "success" | "warning" | "destructive" {
  if (index < 40) return "success"
  if (index < 70) return "warning"
  return "destructive"
}

function SentimentBadge({ sentiment }: { sentiment: number | null }) {
  if (sentiment === null) return null
  if (sentiment > 0.3)
    return (
      <Badge variant="default" className="text-[10px] bg-success/10 text-success border-success/30">
        好评
      </Badge>
    )
  if (sentiment < -0.3)
    return (
      <Badge variant="destructive" className="text-[10px]">
        差评
      </Badge>
    )
  return (
    <Badge variant="secondary" className="text-[10px]">
      中性
    </Badge>
  )
}

export default async function CanteenDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const canteen = await getCanteenBySlug(slug)

  if (!canteen) notFound()

  const hours = formatHours(canteen.hours)
  const reviews = (canteen as unknown as { reviews: Array<{ id: string; content: string; rating: number; sentiment: number | null; createdAt: Date; user: { name: string | null; image: string | null }; dish?: { name: string } }> }).reviews || []

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <MotionWrapper variant="fade-in-up">
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{canteen.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {canteen.address}
                </span>
                {canteen.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {canteen.phone}
                  </span>
                )}
                {hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {hours}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-lg font-bold text-primary">{canteen.avgRating.toFixed(1)}</span>
              </div>
              {canteen.campus && <Badge variant="secondary">{canteen.campus.name}</Badge>}
              {canteen.isOpen ? (
                <Badge variant="default" className="bg-success text-success-foreground">营业中</Badge>
              ) : (
                <Badge variant="destructive">已关闭</Badge>
              )}
            </div>
          </div>
        </div>
      </MotionWrapper>

      {/* Tags */}
      {canteen.tags.length > 0 && (
        <MotionWrapper variant="fade-in-up" delay={0.1}>
          <div className="mb-6 flex flex-wrap gap-2">
            {canteen.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </MotionWrapper>
      )}

      {/* Description */}
      {canteen.description && (
        <MotionWrapper variant="fade-in-up" delay={0.15}>
          <div className="mb-6 rounded-xl border bg-card p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">{canteen.description}</p>
          </div>
        </MotionWrapper>
      )}

      {/* Queue Index */}
      {canteen.queueIndex > 0 && (
        <MotionWrapper variant="fade-in-up" delay={0.2}>
          <div className="mb-8 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">排队指数</span>
              <span
                className={cn(
                  "text-sm font-semibold ml-auto",
                  getQueueVariant(canteen.queueIndex) === "success" && "text-success",
                  getQueueVariant(canteen.queueIndex) === "warning" && "text-warning",
                  getQueueVariant(canteen.queueIndex) === "destructive" && "text-destructive",
                )}
              >
                {canteen.queueIndex}%
              </span>
            </div>
            <Progress value={canteen.queueIndex} variant={getQueueVariant(canteen.queueIndex)} size="md" />
          </div>
        </MotionWrapper>
      )}

      {/* Windows & Dishes */}
      <MotionWrapper variant="fade-in-up" delay={0.25}>
        <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          美食窗口
        </h2>
      </MotionWrapper>

      <div className="space-y-4">
        {canteen.windows.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无窗口信息</p>
        ) : (
          canteen.windows.map((window, i) => (
            <MotionWrapper key={window.id} variant="fade-in-up" delay={0.3 + i * 0.05}>
              <div className="rounded-xl border bg-card p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{window.name}</h3>
                  {window.isOpen ? (
                    <Badge variant="outline" className="text-success border-success">营业中</Badge>
                  ) : (
                    <Badge variant="outline" className="text-destructive border-destructive">已关闭</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {window.category.map((cat) => (
                    <Badge key={cat} variant="outline">
                      {cat}
                    </Badge>
                  ))}
                </div>

                {window.description && (
                  <p className="text-sm text-muted-foreground mb-3">{window.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="font-medium text-foreground">
                    ¥{window.priceMin}-{window.priceMax}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {window.avgRating.toFixed(1)}
                  </span>
                  <span>{window.reviewCount} 条评价</span>
                </div>

                {window.dishes.length > 0 && (
                  <div className="space-y-1">
                    {window.dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="flex items-center justify-between rounded-lg p-2 hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{dish.name}</span>
                          {dish.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          {dish.avgRating > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {dish.avgRating.toFixed(1)}
                            </span>
                          )}
                          <span className="text-sm font-medium text-primary">
                            ¥{dish.price.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MotionWrapper>
          ))
        )}
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-12">
          <MotionWrapper variant="fade-in-up">
            <h2 className="mb-4 text-xl font-semibold">最新评价</h2>
          </MotionWrapper>
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <MotionWrapper key={review.id} variant="fade-in-up" delay={i * 0.05}>
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={review.user.image}
                      fallback={review.user.name?.[0] || "?"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {review.user.name || "匿名用户"}
                        </span>
                        <SentimentBadge sentiment={review.sentiment} />
                        <div className="flex items-center gap-0.5 ml-auto">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={cn(
                                "h-3 w-3",
                                j < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.content}</p>
                    </div>
                  </div>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
