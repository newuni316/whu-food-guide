import { forwardRef, type TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-background text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] p-3",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          error ? "border-destructive focus:ring-destructive/20" : "border-border",
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = "Textarea"
