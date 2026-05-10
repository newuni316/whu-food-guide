"use client"

import { Star, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MapMarker } from "@/types"

interface MapSidebarProps {
  markers: MapMarker[]
  selectedId?: string
  onSelect: (marker: MapMarker) => void
}

export function MapSidebar({ markers, selectedId, onSelect }: MapSidebarProps) {
  const sorted = [...markers].sort((a, b) => b.rating - a.rating)

  return (
    <div className="absolute top-20 right-4 bottom-4 z-[1000] w-72 max-h-[calc(100vh-7rem)] overflow-hidden rounded-xl border bg-background/90 backdrop-blur shadow-md hidden md:flex flex-col">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">食堂列表</h3>
        <p className="text-xs text-muted-foreground">{markers.length} 个结果</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            没有匹配的食堂
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sorted.map((marker) => (
              <button
                key={marker.id}
                onClick={() => onSelect(marker)}
                className={cn(
                  "w-full text-left rounded-lg p-3 transition-colors",
                  selectedId === marker.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium truncate">{marker.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">{marker.campus}</span>
                      {marker.isOpen ? (
                        <Badge variant="default" className="text-[10px] py-0 bg-success text-success-foreground">营业</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] py-0">关</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">{marker.rating.toFixed(1)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
