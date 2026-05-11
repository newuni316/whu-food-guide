import { describe, it, expect } from "vitest"
import { z } from "zod"
import { validateRequest, safeValidate } from "@/lib/validation"

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
})

describe("validateRequest", () => {
  it("returns validated data on success", () => {
    const data = validateRequest(testSchema, { name: "Alice", age: 25 })
    expect(data).toEqual({ name: "Alice", age: 25 })
  })

  it("throws ValidationError on invalid data", () => {
    expect(() => validateRequest(testSchema, { name: "", age: 25 })).toThrow()
    expect(() => validateRequest(testSchema, { name: "Bob", age: -1 })).toThrow()
    expect(() => validateRequest(testSchema, null)).toThrow()
  })
})

describe("safeValidate", () => {
  it("returns success result on valid data", () => {
    const result = safeValidate(testSchema, { name: "Alice", age: 25 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: "Alice", age: 25 })
    }
  })

  it("returns error result on invalid data", () => {
    const result = safeValidate(testSchema, { name: "", age: 25 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
  })
})
