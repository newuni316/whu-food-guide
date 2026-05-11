"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Trophy,
  Flame,
  RotateCcw,
  TrendingUp,
  ChevronDown,
  Utensils,
  Heart,
  X,
  Sparkles,
  Crown,
  Medal,
  Award,
} from "lucide-react"

// ── Types ──

interface FoodItem {
  id: string
  name: string
  restaurant: string
  image?: string
  price: number
  tags: string[]
  elo: number
  wins: number
  losses: number
}

// ── ELO Calculation ──

function calculateElo(
  winnerElo: number,
  loserElo: number,
  kFactor = 32
): { newWinnerElo: number; newLoserElo: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400))

  return {
    newWinnerElo: Math.round(winnerElo + kFactor * (1 - expectedWinner)),
    newLoserElo: Math.round(loserElo + kFactor * (0 - expectedLoser)),
  }
}

// ── Sample Data (Guangba Road) ──

const INITIAL_FOODS: FoodItem[] = [
  {
    id: "gb-01",
    name: "烤鱼",
    restaurant: "成都串串香",
    price: 48,
    tags: ["辣", "聚餐", "网红"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-02",
    name: "热干面",
    restaurant: "蔡林记",
    price: 8,
    tags: ["经典", "早餐", "速食"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-03",
    name: "麻辣烫",
    restaurant: "张亮麻辣烫",
    price: 25,
    tags: ["辣", "自由搭配", "暖胃"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-04",
    name: "黄焖鸡米饭",
    restaurant: "杨铭宇黄焖鸡",
    price: 18,
    tags: ["下饭", "经典", "速食"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-05",
    name: "螺蛳粉",
    restaurant: "柳螺飘香",
    price: 15,
    tags: ["臭", "上瘾", "辣"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-06",
    name: "烧烤拼盘",
    restaurant: "老地方烧烤",
    price: 55,
    tags: ["夜宵", "聚餐", "啤酒搭档"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-07",
    name: "煎饼果子",
    restaurant: "山东杂粮煎饼",
    price: 7,
    tags: ["早餐", "速食", "管饱"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-08",
    name: "酸菜鱼",
    restaurant: "太二酸菜鱼",
    price: 58,
    tags: ["酸", "聚餐", "网红"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-09",
    name: "肉夹馍",
    restaurant: "西安小吃",
    price: 10,
    tags: ["管饱", "经典", "速食"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-10",
    name: "奶茶",
    restaurant: "茶百道",
    price: 12,
    tags: ["甜", "下午茶", "续命"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-11",
    name: "炸鸡",
    restaurant: "正新鸡排",
    price: 15,
    tags: ["炸", "零食", "罪恶"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-12",
    name: "牛肉面",
    restaurant: "兰州拉面",
    price: 16,
    tags: ["汤面", "管饱", "经典"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-13",
    name: "小龙虾",
    restaurant: "虾皇",
    price: 88,
    tags: ["辣", "聚餐", "季节限定"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-14",
    name: "鸡蛋灌饼",
    restaurant: "早餐摊",
    price: 6,
    tags: ["早餐", "速食", "便宜"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-15",
    name: "麻辣香锅",
    restaurant: "川味坊",
    price: 35,
    tags: ["辣", "下饭", "自由搭配"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
  {
    id: "gb-16",
    name: "蛋糕奶茶",
    restaurant: "蜜雪冰城",
    price: 8,
    tags: ["甜", "便宜", "续命"],
    elo: 1200,
    wins: 0,
    losses: 0,
  },
]

const STORAGE_KEY = "whu-food-pk"

// ── Food Card Component ──

function FoodCard({
  item,
  side,
  onClick,
  disabled,
}: {
  item: FoodItem
  side: "left" | "right"
  onClick: () => void
  disabled: boolean
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 p-6 transition-all w-full",
        "bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/10",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-95 touch-manipulation",
        side === "left" ? "border-border" : "border-border"
      )}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      {/* Food emoji/icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Utensils className="h-10 w-10 text-primary" />
      </div>

      <h3 className="text-xl font-bold mb-1">{item.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">{item.restaurant}</p>

      <div className="flex items-center gap-1.5 text-lg font-semibold text-primary mb-3">
        ¥{item.price}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* ELO badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        {item.elo}
      </div>
    </motion.button>
  )
}

// ── Leaderboard Component ──

function Leaderboard({
  foods,
  onClose,
}: {
  foods: FoodItem[]
  onClose: () => void
}) {
  const sorted = [...foods].sort((a, b) => b.elo - a.elo)
  const maxGames = Math.max(...sorted.map((f) => f.wins + f.losses), 1)

  const getRankIcon = (index: number) => {
    if (index === 0)
      return <Crown className="h-5 w-5 text-yellow-500" />
    if (index === 1)
      return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2)
      return <Award className="h-5 w-5 text-amber-600" />
    return (
      <span className="text-sm font-medium text-muted-foreground w-5 text-center">
        {index + 1}
      </span>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-background border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">广八路美食排行榜</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {sorted.map((food, index) => (
            <div
              key={food.id}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3 transition-colors",
                index < 3 ? "bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{food.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {food.restaurant}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium text-primary">
                    {food.elo} ELO
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {food.wins}胜 {food.losses}负
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium">¥{food.price}</div>
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${((food.wins + food.losses) / maxGames) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Game Component ──

export default function GamePage() {
  const [foods, setFoods] = useState<FoodItem[]>(INITIAL_FOODS)
  const [currentPair, setCurrentPair] = useState<[FoodItem, FoodItem] | null>(
    null
  )
  const [round, setRound] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [lastChoice, setLastChoice] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFoods(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foods))
    } catch {
      // ignore
    }
  }, [foods])

  // Pick random pair
  const pickPair = useCallback(() => {
    const available = foods.filter((f) => f.id !== currentPair?.[0]?.id && f.id !== currentPair?.[1]?.id)
    if (available.length < 2) {
      // If not enough unique items, just pick any two
      const shuffled = [...foods].sort(() => Math.random() - 0.5)
      setCurrentPair([shuffled[0], shuffled[1]])
      return
    }
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    setCurrentPair([shuffled[0], shuffled[1]])
  }, [foods, currentPair])

  useEffect(() => {
    if (!currentPair) {
      pickPair()
    }
  }, [currentPair, pickPair])

  const handleChoice = (winnerIndex: 0 | 1) => {
    if (!currentPair || animating) return

    setAnimating(true)
    const winner = currentPair[winnerIndex]
    const loser = currentPair[winnerIndex === 0 ? 1 : 0]

    setLastChoice(winner.id)

    const { newWinnerElo, newLoserElo } = calculateElo(
      winner.elo,
      loser.elo
    )

    setFoods((prev) =>
      prev.map((f) => {
        if (f.id === winner.id)
          return { ...f, elo: newWinnerElo, wins: f.wins + 1 }
        if (f.id === loser.id)
          return { ...f, elo: newLoserElo, losses: f.losses + 1 }
        return f
      })
    )

    setRound((r) => r + 1)

    setTimeout(() => {
      setAnimating(false)
      setLastChoice(null)
      pickPair()
    }, 600)
  }

  const handleReset = () => {
    if (confirm("确定要重置所有数据吗？")) {
      setFoods(INITIAL_FOODS)
      setRound(0)
      setCurrentPair(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const totalVotes = foods.reduce((sum, f) => sum + f.wins + f.losses, 0)
  const topFood = [...foods].sort((a, b) => b.elo - a.elo)[0]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-4">
          <Flame className="h-4 w-4" />
          广八路美食 PK
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          你更想吃哪个？
        </h1>
        <p className="text-muted-foreground">
          点击选择你更想吃的美食，生成广八路排行榜
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-6 px-2"
      >
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            第 {round} 轮
          </span>
          <span>{totalVotes} 次投票</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" />
            排行榜
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
            title="重置数据"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* VS Cards */}
      {currentPair && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`left-${currentPair[0].id}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: lastChoice === currentPair[0].id ? 1.05 : 1,
              }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <FoodCard
                item={currentPair[0]}
                side="left"
                onClick={() => handleChoice(0)}
                disabled={animating}
              />
            </motion.div>

            <motion.div
              key={`right-${currentPair[1].id}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: lastChoice === currentPair[1].id ? 1.05 : 1,
              }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <FoodCard
                item={currentPair[1]}
                side="right"
                onClick={() => handleChoice(1)}
                disabled={animating}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* VS badge */}
      <div className="flex justify-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground font-bold text-lg shadow-lg">
          VS
        </div>
      </div>

      {/* Current champion */}
      {topFood && topFood.wins > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">当前冠军</p>
              <p className="font-semibold">
                {topFood.name} · {topFood.restaurant}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-primary">{topFood.elo}</p>
              <p className="text-xs text-muted-foreground">ELO</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>数据保存在本地，关闭浏览器不会丢失</p>
        <p className="mt-1">多投几轮，排行榜会更准确哦~</p>
      </div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard
            foods={foods}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
