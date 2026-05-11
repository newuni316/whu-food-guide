"use client"

import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { getCampusLabel } from "@/lib/utils"

const campuses = [
  { value: "all", label: "全部" },
  { value: "wenli", label: "文理学部" },
  { value: "gongxue", label: "工学部" },
  { value: "xinxixue", label: "信息学部" },
  { value: "yixue", label: "医学部" },
  { value: "guangbalu", label: "广八路" },
  { value: "yintai", label: "银泰" },
  { value: "jiedaokou", label: "街道口" },
  { value: "guanggu", label: "光谷" },
  { value: "chuhehanjie", label: "楚河汉街" },
  { value: "xudong", label: "徐东" },
  { value: "huquan", label: "虎泉" },
  { value: "yamao", label: "亚贸" },
  { value: "qunguang", label: "群光" },
]

export function CampusFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get("campus") || "all"

  return (
    <div className="flex flex-wrap gap-2">
      {campuses.map((campus) => (
        <button
          key={campus.value}
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            if (campus.value === "all") {
              params.delete("campus")
            } else {
              params.set("campus", campus.value)
            }
            router.push(`?${params.toString()}`)
          }}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            active === campus.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {campus.label}
        </button>
      ))}
    </div>
  )
}
