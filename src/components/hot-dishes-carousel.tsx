"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Dish {
  id: string
  name: string
  price: number
  avgRating: number
  tags: string[]
  window: {
    name: string
    canteen: {
      name: string
      slug: string
    }
  }
}

interface HotDishesCarouselProps {
  dishes: Dish[]
}

export function HotDishesCarousel({ dishes }: HotDishesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return
    const amount = 280
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  if (dishes.length === 0) return null

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:block">
        <button
          onClick={() => scroll("left")}
          className="rounded-full bg-background/80 backdrop-blur border p-2 shadow-md hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:block">
        <button
          onClick={() => scroll("right")}
          className="rounded-full bg-background/80 backdrop-blur border p-2 shadow-md hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 pb-2"
      >
        {dishes.map((dish, i) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="snap-start"
          >
            <Link href={`/cafeteria/${dish.window.canteen.slug}`}>
              <div className="w-[240px] shrink-0 rounded-xl border bg-card p-4 hover:shadow-md transition-all hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{dish.name}</h3>
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">{dish.avgRating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {dish.window.canteen.name} · {dish.window.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">¥{dish.price}</span>
                  <div className="flex gap-1">
                    {dish.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
