"use client"

import { motion } from "framer-motion"
import { Users, Star } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface QueueCanteen {
  id: string
  name: string
  slug: string
  queueIndex: number
  avgRating: number
  campus: { name: string }
}

interface QueueIndicatorProps {
  canteens: QueueCanteen[]
}

function getQueueVariant(index: number): "success" | "warning" | "destructive" {
  if (index < 40) return "success"
  if (index < 70) return "warning"
  return "destructive"
}

function getQueueLabel(index: number): string {
  if (index < 30) return "空闲"
  if (index < 50) return "适中"
  if (index < 70) return "较忙"
  return "高峰"
}

export function QueueIndicator({ canteens }: QueueIndicatorProps) {
  const sorted = [...canteens].sort((a, b) => b.queueIndex - a.queueIndex)

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((canteen, i) => (
        <motion.div
          key={canteen.id}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
        >
          <Link href={`/cafeteria/${canteen.slug}`}>
            <div className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{canteen.name}</h3>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {canteen.campus.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{canteen.avgRating.toFixed(1)}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      getQueueVariant(canteen.queueIndex) === "success" && "text-success",
                      getQueueVariant(canteen.queueIndex) === "warning" && "text-warning",
                      getQueueVariant(canteen.queueIndex) === "destructive" && "text-destructive",
                    )}
                  >
                    {getQueueLabel(canteen.queueIndex)}
                  </span>
                </div>
                <Progress value={canteen.queueIndex} variant={getQueueVariant(canteen.queueIndex)} size="sm" />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Users className="h-4 w-4" />
                <span className="text-sm font-semibold">{canteen.queueIndex}%</span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
