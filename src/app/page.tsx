import Link from "next/link"
import { UtensilsCrossed, Compass, TrendingUp, Bot, MapPin, ArrowRight, Sparkles } from "lucide-react"
import { getCafeterias } from "@/lib/api"
import { CafeteriaGrid } from "@/components/cafeteria-grid"

export default async function HomePage() {
  const cafeterias = await getCafeterias()

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI Native 智慧校园美食平台
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              发现武大
              <span className="block mt-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                每一口美味
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
              AI 智能推荐 · 校园美食地图 · 真实评价 · 智能助手
            </p>
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: "/explore", icon: Compass, label: "探索美食", desc: "发现所有食堂和摊位" },
            { href: "/rankings", icon: TrendingUp, label: "实时热榜", desc: "今日最受欢迎的美食" },
            { href: "/ai-chat", icon: Bot, label: "AI 助手", desc: "智能推荐你的专属美食" },
            { href: "/map", icon: MapPin, label: "校园地图", desc: "食堂位置一目了然" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{item.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
        <CafeteriaGrid cafeterias={cafeterias.slice(0, 6)} />
      </section>
    </div>
  )
}
