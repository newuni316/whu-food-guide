import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  showValue?: boolean
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, showValue, value, min = 0, max = 100, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {(label || showValue) && (
          <div className="flex justify-between text-sm">
            {label && <span className="text-muted-foreground">{label}</span>}
            {showValue && <span className="font-medium">{value}</span>}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          value={value}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm",
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)

Slider.displayName = "Slider"
