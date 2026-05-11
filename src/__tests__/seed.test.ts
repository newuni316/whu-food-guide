import { describe, it, expect, beforeAll } from "vitest"
import * as fs from "fs"
import * as path from "path"

const DATA_DIR = path.join(process.cwd(), "data", "restaurants")

interface RestaurantData {
  name: string
  slug: string
  campus: string
  area: string
  category: string[]
  price_range: number[]
  rating: { taste: number; environment: number; value: number }
  coordinates: { lat: number; lng: number }
  address: string
  hours: string
  recommendations: string[]
  tags: string[]
}

describe("Seed Data Files", () => {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json") && f !== "template.json")

  it("has at least one restaurant data file", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const file of files) {
    describe(`${file}`, () => {
      let data: RestaurantData

      beforeAll(() => {
        data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"))
      })

      it("has required fields", () => {
        expect(data.name).toBeTruthy()
        expect(data.slug).toBeTruthy()
        expect(data.campus).toBeTruthy()
        expect(data.area).toBeTruthy()
        expect(Array.isArray(data.category)).toBe(true)
        expect(Array.isArray(data.price_range)).toBe(true)
        expect(data.coordinates).toBeDefined()
        expect(typeof data.coordinates.lat).toBe("number")
        expect(typeof data.coordinates.lng).toBe("number")
        expect(data.address).toBeTruthy()
        expect(data.hours).toBeTruthy()
        expect(Array.isArray(data.recommendations)).toBe(true)
        expect(Array.isArray(data.tags)).toBe(true)
      })

      it("has valid campus value", () => {
        const validCampuses = ["wenli", "gongxue", "xinxixue", "yixue", "surroundings"]
        expect(validCampuses).toContain(data.campus)
      })

      it("has valid price range", () => {
        expect(data.price_range.length).toBe(2)
        expect(data.price_range[0]).toBeLessThanOrEqual(data.price_range[1])
        expect(data.price_range[0]).toBeGreaterThan(0)
      })

      it("has valid rating (1-5)", () => {
        expect(data.rating.taste).toBeGreaterThanOrEqual(1)
        expect(data.rating.taste).toBeLessThanOrEqual(5)
        expect(data.rating.environment).toBeGreaterThanOrEqual(1)
        expect(data.rating.environment).toBeLessThanOrEqual(5)
        expect(data.rating.value).toBeGreaterThanOrEqual(1)
        expect(data.rating.value).toBeLessThanOrEqual(5)
      })

      it("has unique slug", () => {
        const allSlugs = files.map((f) => {
          const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"))
          return d.slug
        })
        const slugCount = allSlugs.filter((s) => s === data.slug).length
        expect(slugCount).toBe(1)
        expect(data.slug).toMatch(/^[a-z0-9-]+$/)
      })

      it("has valid coordinates", () => {
        expect(data.coordinates.lat).toBeGreaterThan(30)
        expect(data.coordinates.lat).toBeLessThan(31)
        expect(data.coordinates.lng).toBeGreaterThan(114)
        expect(data.coordinates.lng).toBeLessThan(115)
      })
    })
  }
})
