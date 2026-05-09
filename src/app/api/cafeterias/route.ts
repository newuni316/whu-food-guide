import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const cafeterias = await prisma.cafeteria.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(cafeterias)
  } catch {
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 })
  }
}
