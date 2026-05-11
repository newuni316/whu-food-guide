"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  UtensilsCrossed,
  User,
  Sun,
  Moon,
  LogOut,
} from "lucide-react"

export function Navigation() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - hidden on lg+ where sidebar shows */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <UtensilsCrossed className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            武大美食
          </span>
        </Link>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="切换主题"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {session?.user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{session.user.name}</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
                aria-label="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
