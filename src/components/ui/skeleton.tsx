import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular" | "card"
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  const base = "skeleton"

  const variants = {
    text: "h-4 w-full rounded",
    circular: "h-10 w-10 rounded-full",
    rectangular: "h-20 w-full rounded-lg",
    card: "h-40 w-full rounded-xl",
  }

  return <div className={cn(base, variants[variant], className)} aria-hidden="true" />
}
