"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
}

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
}

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const showImage = src && !imgError

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || ""}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : fallback ? (
        <span className="font-medium">{fallback}</span>
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  )
}
