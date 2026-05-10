"use client"

import { Star, Users, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { MapMarker } from "@/types"

interface CanteenPopupProps {
  marker: MapMarker
}

function getQueueVariant(index: number): "success" | "warning" | "destructive" {
  if (index < 40) return "success"
  if (index < 70) return "warning"
  return "destructive"
}

export function CanteenPopup({ marker }: CanteenPopupProps) {
  return (
    <div className="min-w-[200px] p-1">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm">{marker.name}</h3>
        <div className="flex items-center gap-0.5 shrink-0">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-semibold">{marker.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-[10px]">{marker.campus}</Badge>
        {marker.isOpen ? (
          <Badge variant="default" className="text-[10px] bg-success text-success-foreground">营业中</Badge>
        ) : (
          <Badge variant="destructive" className="text-[10px]">已关闭</Badge>
        )}
      </div>

      <Link
        href={`/cafeteria/${marker.slug}`}
        className="block w-full text-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        查看详情
      </Link>
    </div>
  )
}
