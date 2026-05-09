import { prisma } from "@/lib/prisma"
import type { Cafeteria } from "@prisma/client"

export async function getCafeterias(): Promise<Cafeteria[]> {
  try {
    return await prisma.cafeteria.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    return []
  }
}

export async function getCafeteriaBySlug(slug: string) {
  try {
    return await prisma.cafeteria.findFirst({
      where: { slug, deletedAt: null },
      include: {
        stalls: {
          include: { dishes: true },
          where: { deletedAt: null },
        },
      },
    })
  } catch {
    return null
  }
}

export async function getRankings(type?: string) {
  try {
    return await prisma.ranking.findMany({
      where: type ? { type } : undefined,
      orderBy: { score: "desc" },
      take: 10,
    })
  } catch {
    return []
  }
}
