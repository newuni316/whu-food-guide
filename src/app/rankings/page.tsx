import { TrendingUp, Flame, Moon, DollarSign, Dumbbell, Skull } from "lucide-react"
import { RankingSection } from "@/components/ranking-section"

export const metadata = {
  title: "热榜",
  description: "武汉大学美食实时热榜",
}

const iconMap: Record<string, React.ReactNode> = {
  daily: <Flame className="h-5 w-5" />,
  weekly: <TrendingUp className="h-5 w-5" />,
  night: <Moon className="h-5 w-5" />,
  value: <DollarSign className="h-5 w-5" />,
  fitness: <Dumbbell className="h-5 w-5" />,
  dark: <Skull className="h-5 w-5" />,
}

export default function RankingsPage() {
  const rankings = [
    { type: "daily", label: "今日热门", gradient: "from-orange-500 to-red-500" },
    { type: "weekly", label: "本周热门", gradient: "from-blue-500 to-purple-500" },
    { type: "night", label: "夜宵榜", gradient: "from-indigo-500 to-purple-500" },
    { type: "value", label: "性价比榜", gradient: "from-green-500 to-emerald-500" },
    { type: "fitness", label: "健身餐榜", gradient: "from-cyan-500 to-teal-500" },
    { type: "dark", label: "黑暗料理榜", gradient: "from-gray-500 to-zinc-500" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">美食热榜</h1>
        <p className="mt-2 text-muted-foreground">
          基于实时数据的美食排行，发现最受欢迎的美食
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {rankings.map((r) => (
          <RankingSection
            key={r.type}
            type={r.type}
            label={r.label}
            icon={iconMap[r.type]}
            gradient={r.gradient}
          />
        ))}
      </div>
    </div>
  )
}
