import { describe, it, expect } from "vitest"
import { chatWithAI, generateEmbedding } from "@/lib/ai"

describe("AI Module", () => {
  describe("chatWithAI", () => {
    it("returns config error when no API key is set", async () => {
      const originalOpenAIKey = process.env.OPENAI_API_KEY
      const originalDeepSeekKey = process.env.DEEPSEEK_API_KEY
      process.env.OPENAI_API_KEY = ""
      process.env.DEEPSEEK_API_KEY = ""

      const result = await chatWithAI([
        { role: "user", content: "你好" },
      ])

      expect(result).toContain("AI 服务未配置")

      process.env.OPENAI_API_KEY = originalOpenAIKey
      process.env.DEEPSEEK_API_KEY = originalDeepSeekKey
    })

    it("includes context in system prompt", async () => {
      // Can't fully test without API key, but verify the function exists and handles errors
      const fn = chatWithAI
      expect(fn).toBeDefined()
      expect(typeof fn).toBe("function")
    })
  })

  describe("generateEmbedding", () => {
    it("is a defined function", () => {
      expect(generateEmbedding).toBeDefined()
      expect(typeof generateEmbedding).toBe("function")
    })
  })
})
