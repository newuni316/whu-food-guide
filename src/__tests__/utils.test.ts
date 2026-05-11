import { describe, it, expect } from "vitest"
import { cn, formatPrice, formatRating, timeAgo, getCampusLabel, getAreaLabel, slugify } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("handles tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6")
  })
})

describe("formatPrice", () => {
  it("formats price with ¥ symbol", () => {
    expect(formatPrice(15)).toBe("¥15")
  })

  it("strips decimals", () => {
    expect(formatPrice(15.5)).toBe("¥16")
  })
})

describe("formatRating", () => {
  it("formats rating to one decimal", () => {
    expect(formatRating(4.567)).toBe("4.6")
  })
})

describe("slugify", () => {
  it("converts Chinese text to slug", () => {
    expect(slugify("梅园小厨")).toBe("梅园小厨")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world")
  })

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello")
  })
})

describe("timeAgo", () => {
  it("returns seconds ago for recent time", () => {
    const now = new Date()
    expect(timeAgo(new Date(now.getTime() - 30 * 1000))).toBe("刚刚")
  })

  it("returns minutes ago", () => {
    const now = new Date()
    expect(timeAgo(new Date(now.getTime() - 5 * 60 * 1000))).toBe("5分钟前")
  })

  it("returns hours ago", () => {
    const now = new Date()
    expect(timeAgo(new Date(now.getTime() - 3 * 60 * 60 * 1000))).toBe("3小时前")
  })

  it("returns days ago", () => {
    const now = new Date()
    expect(timeAgo(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))).toBe("7天前")
  })

  it("returns locale date string for old dates", () => {
    const oldDate = new Date("2024-01-01")
    expect(timeAgo(oldDate)).toBe(oldDate.toLocaleDateString("zh-CN"))
  })
})

describe("getCampusLabel", () => {
  it("returns correct label for each campus", () => {
    expect(getCampusLabel("wenli")).toBe("文理学部")
    expect(getCampusLabel("gongxue")).toBe("工学部")
    expect(getCampusLabel("xinxixue")).toBe("信息学部")
    expect(getCampusLabel("yixue")).toBe("医学部")
    expect(getCampusLabel("guangbalu")).toBe("广八路")
    expect(getCampusLabel("yintai")).toBe("银泰")
  })

  it("returns input for unknown campus", () => {
    expect(getCampusLabel("unknown")).toBe("unknown")
  })
})

describe("getAreaLabel", () => {
  it("returns correct label for each area", () => {
    expect(getAreaLabel("meiyuan")).toBe("梅园")
    expect(getAreaLabel("guiyuan")).toBe("桂园")
    expect(getAreaLabel("fengyuan")).toBe("枫园")
    expect(getAreaLabel("yingyuan")).toBe("樱园")
    expect(getAreaLabel("gongxue")).toBe("工学部")
    expect(getAreaLabel("xinxixue")).toBe("信息学部")
    expect(getAreaLabel("yixue")).toBe("医学部")
    expect(getAreaLabel("guangbalu")).toBe("广八路")
    expect(getAreaLabel("jiedaokou")).toBe("街道口")
  })
})
