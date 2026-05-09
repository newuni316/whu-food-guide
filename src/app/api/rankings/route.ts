import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || undefined

  try {
    const rankings = await prisma.ranking.findMany({
      where: type ? { type } : undefined,
      orderBy: { score: "desc" },
      take: 20,
      include: { cafeteria: true },
    })
    return NextResponse.json(rankings)
  } catch {
    return NextResponse.json({ error: "获取排行失败" }, { status: 500 })
  }
}
