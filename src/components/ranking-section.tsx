"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

interface RankingSectionProps {
  type: string
  label: string
  icon: ReactNode
  gradient: string
}

export function RankingSection({ label, icon, gradient }: RankingSectionProps) {
  const items = [
    { rank: 1, name: "信息学部一食堂", score: 4.8 },
    { rank: 2, name: "梅园小厨", score: 4.6 },
    { rank: 3, name: "桂园食堂", score: 4.5 },
  ]

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex items-center gap-2 text-white">
          {icon}
          <CardTitle className="text-lg">{label}</CardTitle>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    item.rank === 1
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : item.rank === 2
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      : item.rank === 3
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {item.rank}
                </span>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-primary">{item.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
