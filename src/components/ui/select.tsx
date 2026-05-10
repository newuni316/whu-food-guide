import { forwardRef, type SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full h-10 rounded-lg border bg-background text-foreground px-4 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-destructive focus:ring-destructive/20" : "border-border",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = "Select"
