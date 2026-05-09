import { MapPin, Navigation } from "lucide-react"

export const metadata = {
  title: "校园美食地图",
  description: "武汉大学美食地图 — 食堂位置导航",
}

export default function MapPage() {
  const areas = [
    { name: "文理学部", restaurants: ["梅园食堂", "桂园食堂", "枫园食堂", "樱园咖啡"] },
    { name: "工学部", restaurants: ["工学部黄焖鸡", "工学部烧烤摊"] },
    { name: "信息学部", restaurants: ["信息学部一食堂", "信部螺蛳粉"] },
    { name: "医学部", restaurants: ["医学部烤肉饭"] },
    { name: "周边商圈", restaurants: ["广八路各餐厅", "街道口各餐厅"] },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">校园美食地图</h1>
        <p className="mt-2 text-muted-foreground">
          武汉大学各学部食堂分布总览
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="aspect-square rounded-xl border border-border bg-secondary/50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-primary/50" />
            <p className="mt-2 text-sm text-muted-foreground">地图加载中...</p>
            <p className="text-xs text-muted-foreground/60">(需要集成 Mapbox/高德地图 API)</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">学部概览</h2>
          {areas.map((area) => (
            <div
              key={area.name}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
            >
              <h3 className="font-semibold">{area.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {area.restaurants.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
