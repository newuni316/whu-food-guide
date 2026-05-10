"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab?: string
  onChange?: (id: string) => void
  variant?: "underline" | "pill"
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, variant = "underline", className }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || "")
  const active = activeTab ?? internalActive

  function handleChange(id: string) {
    setInternalActive(id)
    onChange?.(id)
  }

  if (variant === "pill") {
    return (
      <div className={cn("flex gap-1 rounded-lg bg-muted p-1", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active === tab.id && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-md bg-background shadow-sm"
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex gap-0 border-b", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
            active === tab.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.icon}
          {tab.label}
          {active === tab.id && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
