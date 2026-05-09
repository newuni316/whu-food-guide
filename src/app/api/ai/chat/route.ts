import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "消息格式不正确" },
        { status: 400 }
      )
    }

    const { chatWithAI } = await import("@/lib/ai")
    const content = await chatWithAI(messages, context)

    return NextResponse.json({ content })
  } catch (error) {
    console.error("AI Chat Error:", error)
    return NextResponse.json(
      { error: "AI 服务暂时不可用" },
      { status: 500 }
    )
  }
}
