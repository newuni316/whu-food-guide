import { PrismaClient, Campus, Area, UserRole } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const DATA_DIR = path.join(process.cwd(), "data", "restaurants")

interface RestaurantData {
  name: string
  slug: string
  campus: string
  area: string
  category: string[]
  price_range: number[]
  rating: {
    taste: number
    environment: number
    value: number
  }
  coordinates: {
    lat: number
    lng: number
  }
  address: string
  hours: string
  phone?: string
  images?: string[]
  recommendations: string[]
  tags: string[]
  review?: string
  source: string
  last_verified: string
  contributor?: string
}

function mapCampus(campus: string): Campus {
  const map: Record<string, Campus> = {
    wenli: "wenli",
    gongxue: "gongxue",
    xinxixue: "xinxixue",
    yixue: "yixue",
    surroundings: "surroundings",
  }
  return map[campus] || "wenli"
}

function mapArea(area: string): Area {
  const map: Record<string, Area> = {
    "梅园": "meiyuan",
    "桂园": "guiyuan",
    "枫园": "fengyuan",
    "樱园": "yingyuan",
    "工学部": "gongxue",
    "信息学部": "xinxixue",
    "医学部": "yixue",
    "广八路": "guangbalu",
    "街道口": "jiedaokou",
  }
  return map[area] || "gongxue"
}

const RANKING_TYPES = [
  { type: "daily", label: "今日热门" },
  { type: "weekly", label: "本周热门" },
  { type: "night", label: "夜宵榜" },
  { type: "value", label: "性价比榜" },
  { type: "fitness", label: "健身餐榜" },
  { type: "dark", label: "黑暗料理榜" },
]

async function seedUsers() {
  const passwordHash = await bcrypt.hash("123456", 12)

  const users = [
    { name: "张三", email: "zhangsan@whu.edu.cn", role: "user" as UserRole },
    { name: "李四", email: "lisi@whu.edu.cn", role: "user" as UserRole },
    { name: "管理员", email: "admin@whu.edu.cn", role: "admin" as UserRole },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        profile: {
          create: {
            bio: `WHU ${u.name}`,
            grade: "2024",
            major: "计算机科学与技术",
          },
        },
      },
    })
  }

  console.log(`  ✅ 创建了 ${users.length} 个测试用户 (密码: 123456)`)
}

async function seed() {
  console.log("🌱 开始导入数据...\n")

  console.log("📦 创建测试用户...")
  await seedUsers()

  console.log("\n🏪 导入食堂数据...")
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json") && f !== "template.json")

  const allCafeterias: { id: string; name: string; rating: { taste: number; environment: number; value: number } | null }[] = []

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file)
    const data: RestaurantData = JSON.parse(fs.readFileSync(filePath, "utf-8"))

    console.log(`  导入: ${data.name}`)

    const cafeteria = await prisma.cafeteria.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        campus: mapCampus(data.campus),
        area: mapArea(data.area),
        address: data.address,
        hours: data.hours,
        phone: data.phone || null,
        coordinates: data.coordinates,
        images: data.images || [],
        tags: data.tags,
        source: data.source,
        contributor: data.contributor || null,
        lastVerified: new Date(data.last_verified),
        review: data.review || null,
        rating: data.rating || null,
        recommendations: data.recommendations,
      },
      create: {
        name: data.name,
        slug: data.slug,
        campus: mapCampus(data.campus),
        area: mapArea(data.area),
        address: data.address,
        hours: data.hours,
        phone: data.phone || null,
        coordinates: data.coordinates,
        images: data.images || [],
        tags: data.tags,
        source: data.source,
        contributor: data.contributor || null,
        lastVerified: new Date(data.last_verified),
        review: data.review || null,
        rating: data.rating || null,
        recommendations: data.recommendations,
      },
    })

    const stallId = `${cafeteria.id}-main`
    const stall = await prisma.stall.upsert({
      where: { id: stallId },
      update: {
        name: `${data.name}主窗口`,
        category: data.category,
        priceRange: data.price_range,
        tags: data.tags,
        description: data.review || null,
      },
      create: {
        id: stallId,
        name: `${data.name}主窗口`,
        cafeteriaId: cafeteria.id,
        category: data.category,
        priceRange: data.price_range,
        tags: data.tags,
        description: data.review || null,
      },
    })

    for (const dishName of data.recommendations) {
      const dishId = `${stall.id}-${dishName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")}`
      const avgPrice = data.price_range.length >= 2
        ? Math.round((data.price_range[0] + data.price_range[1]) / 2)
        : null

      await prisma.dish.upsert({
        where: { id: dishId },
        update: {
          name: dishName,
          tags: data.tags,
          price: avgPrice,
        },
        create: {
          id: dishId,
          name: dishName,
          stallId: stall.id,
          tags: data.tags,
          price: avgPrice,
          rating: data.rating
            ? parseFloat(((data.rating.taste + data.rating.environment + data.rating.value) / 3).toFixed(1))
            : null,
        },
      })
    }

    allCafeterias.push({ id: cafeteria.id, name: data.name, rating: data.rating })
  }

  console.log(`\n📊 创建排行榜数据...`)
  for (const { id: cafeteriaId, name, rating } of allCafeterias) {
    if (!rating) continue
    const avgScore = parseFloat(((rating.taste + rating.environment + rating.value) / 3).toFixed(1))

    for (const rankingType of RANKING_TYPES) {
      const scoreVariation = Math.random() * 1.0 - 0.5
      const finalScore = parseFloat(Math.max(1, Math.min(5, avgScore + scoreVariation)).toFixed(1))

      await prisma.ranking.upsert({
        where: {
          id: `${cafeteriaId}-${rankingType.type}`,
        },
        update: {
          score: finalScore,
          label: rankingType.label,
          rank: 1,
          period: new Date().toISOString().split("T")[0],
        },
        create: {
          id: `${cafeteriaId}-${rankingType.type}`,
          type: rankingType.type,
          label: rankingType.label,
          score: finalScore,
          rank: 1,
          cafeteriaId,
          period: new Date().toISOString().split("T")[0],
        },
      })
    }
  }

  const today = new Date().toISOString().split("T")[0]
  for (const rt of RANKING_TYPES) {
    const rankings = await prisma.ranking.findMany({
      where: { type: rt.type, period: today },
      orderBy: { score: "desc" },
    })
    for (let i = 0; i < rankings.length; i++) {
      await prisma.ranking.update({
        where: { id: rankings[i].id },
        data: { rank: i + 1 },
      })
    }
  }

  console.log(`\n✅ 数据导入完成!`)
  console.log(`   - ${allCafeterias.length} 个食堂`)
  console.log(`   - ${RANKING_TYPES.length} 种排行榜`)
  console.log(`   - 3 个测试用户 (密码: 123456)`)
  console.log(`\n💡 使用以下账号登录:`)
  console.log(`   - 管理员: admin@whu.edu.cn / 123456`)
  console.log(`   - 普通用户: zhangsan@whu.edu.cn / 123456`)
}

seed()
  .catch((e) => {
    console.error("❌ 种子数据导入失败:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
