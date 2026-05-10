"use client"

import { motion } from "framer-motion"
import { Star, ThumbsUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Review {
  id: string
  content: string
  rating: number
  sentiment: number | null
  createdAt: string
  user: { name: string | null; image: string | null }
  dish: { name: string }
}

interface FeaturedReviewsProps {
  reviews: Review[]
}

function getSentimentBadge(sentiment: number | null) {
  if (sentiment === null) return null
  if (sentiment > 0.3) return { label: "好评", variant: "default" as const, className: "bg-success/10 text-success border-success/30" }
  if (sentiment < -0.3) return { label: "差评", variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/30" }
  return { label: "中性", variant: "secondary" as const, className: "" }
}

export function FeaturedReviews({ reviews }: FeaturedReviewsProps) {
  if (reviews.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {reviews.map((review, i) => {
        const sentimentBadge = getSentimentBadge(review.sentiment)
        return (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <Avatar
                src={review.user.image}
                fallback={review.user.name?.[0] || "?"}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {review.user.name || "匿名用户"}
                  </span>
                  {sentimentBadge && (
                    <Badge variant={sentimentBadge.variant} className={cn("text-[10px]", sentimentBadge.className)}>
                      {sentimentBadge.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
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
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{review.content}</p>
            <p className="text-xs text-muted-foreground">评价：{review.dish.name}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
