import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getAreaBySlug, getAllAreas } from "@/config/areas"
import { getCanteens } from "@/lib/api"
import { CafeteriaGrid } from "@/components/cafeteria-grid"
import { MotionWrapper } from "@/components/motion-wrapper"
import { MapPin, Clock, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AreaPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const areas = getAllAreas()
  return areas.map((area) => ({ slug: area.slug }))
}

export async function generateMetadata({
  params,
}: AreaPageProps): Promise<Metadata> {
  const { slug } = await params
  const area = getAreaBySlug(slug)
  if (!area) return {}

  return {
    title: `${area.name}美食`,
    description: area.description,
  }
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { slug } = await params
  const area = getAreaBySlug(slug)

  if (!area) {
    notFound()
  }

  // Fetch all canteens and filter by campus/area
  const allCanteens = await getCanteens()

  // Filter canteens matching this area
  const areaCanteens = allCanteens.filter((canteen) => {
    // Match by campus code
    if (area.campus && canteen.campus?.code === area.campus) {
      return true
    }
    // Match by area name in address or name
    const areaName = area.name.toLowerCase()
    const canteenText = `${canteen.name} ${canteen.address || ""}`.toLowerCase()
    if (canteenText.includes(areaName)) {
      return true
    }
    // Match by slug prefix (for campus-based areas)
    if (canteen.slug.startsWith(slug)) {
      return true
    }
    return false
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <MotionWrapper variant="fade-in-up">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {area.name}美食
              </h1>
              <p className="text-muted-foreground">{area.description}</p>
            </div>
          </div>
        </div>
      </MotionWrapper>

      {/* Stats */}
      <MotionWrapper variant="fade-in-up" delay={0.1}>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {areaCanteens.length}
            </div>
            <div className="text-sm text-muted-foreground">餐厅</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {areaCanteens.length > 0
                ? (
                    areaCanteens.reduce((sum, c) => sum + (c.avgRating || 0), 0) /
                    areaCanteens.length
                  ).toFixed(1)
                : "-"}
            </div>
            <div className="text-sm text-muted-foreground">平均评分</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {areaCanteens.filter((c) => c.isOpen !== false).length}
            </div>
            <div className="text-sm text-muted-foreground">营业中</div>
          </div>
        </div>
      </MotionWrapper>

      {/* Canteen List */}
      {areaCanteens.length > 0 ? (
        <MotionWrapper variant="fade-in-up" delay={0.2}>
          <CafeteriaGrid cafeterias={areaCanteens} />
        </MotionWrapper>
      ) : (
        <MotionWrapper variant="fade-in-up" delay={0.2}>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">暂无餐厅数据</h3>
            <p className="text-muted-foreground max-w-md">
              该区域暂时还没有收录餐厅，我们正在努力扩充数据。
              <br />
              如果你知道这里的好吃的，欢迎通过管理后台添加！
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              去探索其他区域
            </Link>
          </div>
        </MotionWrapper>
      )}
    </div>
  )
}
