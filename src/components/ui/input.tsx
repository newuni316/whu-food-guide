import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base",
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-background text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses.md,
          error ? "border-destructive focus:ring-destructive/20" : "border-border",
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = "Input"
