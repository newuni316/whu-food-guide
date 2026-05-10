import { cn } from "@/lib/utils"

interface TooltipProps {
  content: string
  position?: "top" | "bottom" | "left" | "right"
  children: React.ReactNode
  className?: string
}

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
}

export function Tooltip({ content, position = "top", children, className }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={cn(
          "absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity",
          "px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap",
          positionClasses[position],
          className,
        )}
      >
        {content}
      </div>
    </div>
  )
}
