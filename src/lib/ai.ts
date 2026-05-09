export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIAgentContext {
  cafeteria?: string
  budget?: number
  diet?: string
  time?: string
  location?: string
}

async function getClient() {
  const { default: OpenAI } = await import("openai")
  const provider = process.env.AI_PROVIDER || "openai"
  if (provider === "deepseek") {
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseURL: "https://api.deepseek.com/v1",
    })
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  })
}

export async function chatWithAI(
  messages: ChatMessage[],
  context?: AIAgentContext
) {
  if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    return "AI 服务未配置。请在环境变量中设置 OPENAI_API_KEY 或 DEEPSEEK_API_KEY。"
  }

  const systemPrompt = `你是"珞珈美食助手"，武汉大学智慧校园美食平台的 AI 助手。
你精通武汉大学各个食堂、摊位和菜品。
你的任务是帮助学生找到最适合的美食。

${context ? `当前上下文：
${context.cafeteria ? `- 食堂：${context.cafeteria}` : ""}
${context.budget ? `- 预算：¥${context.budget}` : ""}
${context.diet ? `- 饮食需求：${context.diet}` : ""}
${context.time ? `- 时间：${context.time}` : ""}
${context.location ? `- 位置：${context.location}` : ""}
` : ""}

请用友好、热情的语气回答，推荐具体菜品和窗口，给出价格参考。回答要简洁但信息丰富。`

  try {
    const client = await getClient()
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })
    return completion.choices[0]?.message?.content || ""
  } catch (error) {
    console.error("AI Chat Error:", error)
    return "AI 服务暂时不可用，请稍后再试。"
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const { default: OpenAI } = await import("openai")
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  })
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })
  return response.data[0].embedding
}
