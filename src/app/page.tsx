import Link from "next/link"
import { ArrowRight, Sparkles, Compass, TrendingUp, Bot, MapPin, Gamepad2 } from "lucide-react"
import { getCanteens } from "@/lib/api"
import { CafeteriaGrid } from "@/components/cafeteria-grid"
import { HotDishesCarousel } from "@/components/hot-dishes-carousel"
import { QueueIndicator } from "@/components/queue-indicator"
import { FeaturedReviews } from "@/components/featured-reviews"
import { MotionWrapper } from "@/components/motion-wrapper"
import { StructuredData } from "@/components/seo/structured-data"
import { prisma } from "@/lib/prisma"

async function getHotDishes() {
  return prisma.dish.findMany({
    where: { deletedAt: null, isAvailable: true },
    orderBy: { avgRating: "desc" },
    take: 10,
    include: {
      window: {
        include: {
          canteen: { select: { name: true, slug: true } },
        },
      },
    },
  })
}

async function getRecentReviews() {
  return prisma.review.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      user: { select: { name: true, image: true } },
      dish: { select: { name: true } },
    },
  })
}

export default async function HomePage() {
  const [canteens, hotDishes, recentReviews] = await Promise.all([
    getCanteens(),
    getHotDishes(),
    getRecentReviews(),
  ])

  const topCanteens = canteens.slice(0, 6)
  const queueCanteens = canteens
    .filter((c) => c.queueIndex > 0)
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      queueIndex: c.queueIndex,
      avgRating: c.avgRating,
      campus: { name: c.campus?.name || "" },
    }))

  return (
    <div>
      <StructuredData type="website" />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border min-h-[80vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
        <div className="absolute top-20 right-[10%] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 left-[10%] h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-3xl text-center">
            <MotionWrapper variant="fade-in-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI Native 智慧校园美食平台
              </div>
            </MotionWrapper>

            <MotionWrapper variant="fade-in-up" delay={0.1}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
                发现武大
                <span className="block mt-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  每一口美味
                </span>
              </h1>
            </MotionWrapper>

            <MotionWrapper variant="fade-in-up" delay={0.2}>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto text-balance">
                AI 智能推荐 · 校园美食地图 · 真实评价 · 智能助手
              </p>
            </MotionWrapper>

            <MotionWrapper variant="fade-in-up" delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                >
                  开始探索
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/map"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-secondary transition-all"
                >
                  <MapPin className="h-4 w-4" />
                  美食地图
                </Link>
              </div>
            </MotionWrapper>
          </div>
        </div>
      </section>

      {/* Quick Nav */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: "/explore", icon: Compass, label: "探索美食", desc: "发现所有食堂和摊位" },
            { href: "/rankings", icon: TrendingUp, label: "实时热榜", desc: "今日最受欢迎的美食" },
            { href: "/game", icon: Gamepad2, label: "美食PK", desc: "广八路美食投票排行" },
            { href: "/map", icon: MapPin, label: "校园地图", desc: "食堂位置一目了然" },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <MotionWrapper key={item.href} variant="fade-in-up" delay={i * 0.08}>
                <Link
                  href={item.href}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20 block h-full"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </Link>
              </MotionWrapper>
            )
          })}
        </div>
      </section>

      {/* Hot Dishes Carousel */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <MotionWrapper variant="fade-in-up">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">热门菜品</h2>
            <p className="mt-1 text-muted-foreground">全校好评最多的招牌菜</p>
          </div>
        </MotionWrapper>
        <HotDishesCarousel dishes={hotDishes} />
      </section>

      {/* Queue Indicators */}
      {queueCanteens.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <MotionWrapper variant="fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">实时排队</h2>
              <p className="mt-1 text-muted-foreground">当前各食堂排队情况</p>
            </div>
          </MotionWrapper>
          <QueueIndicator canteens={queueCanteens} />
        </section>
      )}

      {/* Hot Cafeterias */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <MotionWrapper variant="fade-in-up">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">热门食堂</h2>
              <p className="mt-1 text-muted-foreground">探索武大最受欢迎的觅食去处</p>
            </div>
            <Link
              href="/explore"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              查看全部 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </MotionWrapper>
        <CafeteriaGrid cafeterias={topCanteens} />
      </section>

      {/* Featured Reviews */}
      {recentReviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <MotionWrapper variant="fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">最新评价</h2>
              <p className="mt-1 text-muted-foreground">来自真实用户的美食体验</p>
            </div>
          </MotionWrapper>
          <FeaturedReviews reviews={recentReviews.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }))} />
        </section>
      )}
    </div>
  )
}
