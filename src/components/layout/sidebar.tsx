"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"

import { cn } from "@/lib/utils"
import { getSidebarItems } from "@/config/areas"
import {
  Monitor,
  BookOpen,
  Wrench,
  Heart,
  MapPin,
  ShoppingBag,
  MoreHorizontal,
  Navigation,
  Zap,
  Building,
  Store,
  Coffee,
  ShoppingCart,
  Gift,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Menu,
  UtensilsCrossed,
  Home,
  Compass,
  TrendingUp,
  Bot,
  Map,
  Gamepad2,
} from "lucide-react"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor,
  BookOpen,
  Wrench,
  Heart,
  MapPin,
  ShoppingBag,
  MoreHorizontal,
  Navigation,
  Zap,
  Building,
  Store,
  Coffee,
  ShoppingCart,
  Gift,
}

const homeNavItem = { href: "/", label: "首页", icon: Home }
const otherNavItems = [
  { href: "/explore", label: "探索", icon: Compass },
  { href: "/rankings", label: "热榜", icon: TrendingUp },
  { href: "/game", label: "美食PK", icon: Gamepad2 },
  { href: "/ai-chat", label: "AI助手", icon: Bot },
  { href: "/map", label: "地图", icon: Map },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const sidebarItems = getSidebarItems()
  const sidebarItemsRef = useRef(sidebarItems)
  sidebarItemsRef.current = sidebarItems

  useEffect(() => {
    const currentSlug = pathname.split("/area/")[1]
    if (currentSlug) {
      for (const group of sidebarItemsRef.current) {
        if (group.areas.some((a) => a.slug === currentSlug)) {
          setExpandedGroups((prev) => new Set([...prev, group.id]))
        }
      }
    }
  }, [pathname])

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredItems = search
    ? sidebarItems
        .map((group) => ({
          ...group,
          areas: group.areas.filter((a) =>
            a.name.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((group) => group.areas.length > 0)
    : sidebarItems

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
          <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">武大美食</span>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索地点..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Home + Area Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 scrollbar-hide">
        {/* 首页 */}
        {(() => {
          const Icon = homeNavItem.icon
          const isActive = pathname === homeNavItem.href
          return (
            <Link
              key={homeNavItem.href}
              href={homeNavItem.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {homeNavItem.label}
            </Link>
          )
        })()}

        {/* 美味地点 */}
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5 mt-2">
          美味地点
        </div>
        {filteredItems.map((group) => {
          const GroupIcon = iconMap[group.icon] || MapPin
          const isExpanded = expandedGroups.has(group.id)
          const hasActiveArea = group.areas.some(
            (a) => pathname === `/area/${a.slug}`
          )

          // "More" group always shows as expandable
          if (group.id === "more") {
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    hasActiveArea
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <MoreHorizontal className="h-4 w-4 shrink-0" />
                    {group.name}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 border-l border-border/50 pl-2 space-y-0.5 animate-in">
                    {group.areas.map((area) => {
                      const AreaIcon = iconMap[area.icon] || MapPin
                      const isActive = pathname === `/area/${area.slug}`
                      return (
                        <Link
                          key={area.slug}
                          href={`/area/${area.slug}`}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <AreaIcon className="h-3.5 w-3.5 shrink-0" />
                          {area.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Single-area groups: direct link
          if (group.areas.length === 1) {
            const area = group.areas[0]
            const isActive = pathname === `/area/${area.slug}`
            return (
              <Link
                key={group.id}
                href={`/area/${area.slug}`}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <GroupIcon className="h-4 w-4 shrink-0" />
                {group.name}
              </Link>
            )
          }

          // Multi-area groups: expandable
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  hasActiveArea
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  {group.name}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="ml-4 border-l border-border/50 pl-2 space-y-0.5 animate-in">
                  {group.areas.map((area) => {
                    const AreaIcon = iconMap[area.icon] || MapPin
                    const isActive = pathname === `/area/${area.slug}`
                    return (
                      <Link
                        key={area.slug}
                        href={`/area/${area.slug}`}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                      >
                        <AreaIcon className="h-3.5 w-3.5 shrink-0" />
                        {area.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* 其他导航 */}
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5 mt-2">
          导航
        </div>
        {otherNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** Desktop sidebar */
export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/50 bg-background h-screen sticky top-0">
      <SidebarContent />
    </aside>
  )
}

/** Mobile sidebar drawer */
export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
        aria-label="打开导航"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-overlay"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl animate-slide-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-sm font-medium">导航</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
