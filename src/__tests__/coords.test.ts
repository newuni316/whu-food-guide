import { describe, it, expect } from "vitest"
import { gcj02ToWgs84 } from "@/lib/coords"

describe("gcj02ToWgs84", () => {
  it("returns same coords for out-of-China location", () => {
    const [lng, lat] = gcj02ToWgs84(-0.1278, 51.5074)
    expect(lng).toBeCloseTo(-0.1278, 4)
    expect(lat).toBeCloseTo(51.5074, 4)
  })

  it("converts WHU campus GCJ-02 to WGS-84 with expected offset", () => {
    // 武大 campus in GCJ-02: ~30.536, 114.369
    const [lng, lat] = gcj02ToWgs84(114.369, 30.536)
    // Longitude should decrease (shift west)
    expect(lng).toBeLessThan(114.369)
    // Offset should be in reasonable range (~0.003-0.01 degrees, ~300m-1km)
    expect(114.369 - lng).toBeGreaterThan(0.003)
    expect(114.369 - lng).toBeLessThan(0.01)
    // Latitude offset magnitude should be reasonable
    expect(Math.abs(lat - 30.536)).toBeGreaterThan(0.001)
    expect(Math.abs(lat - 30.536)).toBeLessThan(0.005)
  })

  it("produces consistent results for same input", () => {
    const [lng1, lat1] = gcj02ToWgs84(114.369, 30.536)
    const [lng2, lat2] = gcj02ToWgs84(114.369, 30.536)
    expect(lng1).toBe(lng2)
    expect(lat1).toBe(lat2)
  })
})
