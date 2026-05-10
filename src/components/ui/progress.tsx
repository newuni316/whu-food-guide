import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  max?: number
  variant?: "default" | "success" | "warning" | "destructive"
  size?: "sm" | "md" | "lg"
  className?: string
  animated?: boolean
}

const variantClasses = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
}

export function Progress({
  value,
  max = 100,
  variant = "default",
  size = "md",
  className,
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      className={cn("w-full rounded-full bg-muted overflow-hidden", sizeClasses[size], className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          variantClasses[variant],
          animated && "duration-700 ease-out",
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
