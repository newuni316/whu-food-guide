"use client"

import { useState } from "react"
import { Search, X, Locate, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface MapSearchProps {
  onSearch: (query: string) => void
  onCampusFilter: (campus: string) => void
  onLocate: () => void
  activeCampus: string
}

const CAMPUS_OPTIONS = [
  { code: "", label: "全部" },
  { code: "文理学部", label: "文理学部" },
  { code: "工学部", label: "工学部" },
  { code: "信息学部", label: "信息学部" },
  { code: "医学部", label: "医学部" },
  { code: "周边商圈", label: "周边" },
]

export function MapSearch({ onSearch, onCampusFilter, onLocate, activeCampus }: MapSearchProps) {
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md">
      <div className="rounded-xl border bg-background/90 backdrop-blur shadow-md p-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                onSearch(e.target.value)
              }}
              placeholder="搜索食堂..."
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("")
                  onSearch("")
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "rounded-lg p-2 transition-colors",
              showFilters ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={onLocate}
            className="rounded-lg p-2 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Locate className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t">
            {CAMPUS_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => onCampusFilter(opt.code)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  activeCampus === opt.code
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
