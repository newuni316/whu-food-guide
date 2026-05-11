import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `¥${price.toFixed(0)}`
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "刚刚"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString("zh-CN")
}

export function getCampusLabel(campus: string): string {
  const map: Record<string, string> = {
    wenli: "文理学部",
    gongxue: "工学部",
    xinxixue: "信息学部",
    yixue: "医学部",
    guangbalu: "广八路",
    yintai: "银泰",
    jiedaokou: "街道口",
    guanggu: "光谷",
    chuhehanjie: "楚河汉街",
    xudong: "徐东",
    huquan: "虎泉",
    yamao: "亚贸",
    qunguang: "群光",
  }
  return map[campus] || campus
}

export function getAreaLabel(area: string): string {
  const map: Record<string, string> = {
    meiyuan: "梅园",
    guiyuan: "桂园",
    fengyuan: "枫园",
    yingyuan: "樱园",
    gongxue: "工学部",
    xinxixue: "信息学部",
    yixue: "医学部",
    guangbalu: "广八路",
    jiedaokou: "街道口",
  }
  return map[area] || area
}
