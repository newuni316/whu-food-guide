"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, BarChart3, Sparkles, Map, Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/explore", label: "探索", icon: Compass },
  { href: "/rankings", label: "热榜", icon: BarChart3 },
  { href: "/game", label: "PK", icon: Gamepad2 },
  { href: "/map", label: "地图", icon: Map },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/80 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
