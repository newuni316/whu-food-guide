'use client';

import { UtensilsCrossed, MessageSquare, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';

// ─── 类型定义 ───────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number;
    icon: string;
    color: string;
}

interface SentimentTrend {
    date: string;
    positive: number;
    negative: number;
    neutral: number;
}

interface RecommendationStats {
    positive: number;
    negative: number;
    total: number;
}

interface NegativeReview {
    id: string;
    content: string;
    rating: number;
    sentiment: number | null;
    createdAt: string;
    user: { name: string | null };
    dish: { name: string };
}

interface DashboardClientProps {
    stats: { label: string; value: number; icon: string; color: string }[];
    sentimentTrend: SentimentTrend[];
    recommendationStats: RecommendationStats;
    negativeReviews: NegativeReview[];
}

// ─── 图标映射 ───────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    UtensilsCrossed,
    TrendingUp,
    MessageSquare,
    Users,
};

const PIE_COLORS = ['#22c55e', '#ef4444', '#94a3b8'];

// ─── 统计卡片组件 ──────────────────────────────────

function StatCard({ label, value, icon, color }: StatCardProps) {
    const Icon = ICON_MAP[icon] || TrendingUp;
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="text-2xl font-bold mt-2">{value}</div>
        </div>
    );
}

// ─── 主组件 ─────────────────────────────────────────

export function DashboardClient({
    stats,
    sentimentTrend,
    recommendationStats,
    negativeReviews,
}: DashboardClientProps) {
    const pieData = [
        { name: '正面', value: recommendationStats.positive },
        { name: '负面', value: recommendationStats.negative },
        { name: '无反馈', value: recommendationStats.total - recommendationStats.positive - recommendationStats.negative },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 情感趋势折线图 */}
                <div className="rounded-xl border bg-card p-4">
                    <h2 className="font-semibold mb-4">近30天评价情感趋势</h2>
                    {sentimentTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={sentimentTrend}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                />
                                <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} name="正面" dot={false} />
                                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} name="负面" dot={false} />
                                <Line type="monotone" dataKey="neutral" stroke="#94a3b8" strokeWidth={2} name="中性" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
                            暂无评价数据
                        </div>
                    )}
                </div>

                {/* AI 推荐有效率饼图 */}
                <div className="rounded-xl border bg-card p-4">
                    <h2 className="font-semibold mb-4">AI 推荐有效率</h2>
                    {recommendationStats.total > 0 ? (
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                        label={false}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span>正面反馈：{recommendationStats.positive}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span>负面反馈：{recommendationStats.negative}</span>
                                </div>
                                <div className="text-muted-foreground">
                                    总计 {recommendationStats.total} 次推荐
                                </div>
                                <div className="font-medium text-lg">
                                    有效率 {((recommendationStats.positive / recommendationStats.total) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
                            暂无推荐反馈数据
                        </div>
                    )}
                </div>
            </div>

            {/* 待处理事项 + 最新评价 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 待处理：负面评价 */}
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <h2 className="font-semibold">待处理 — 负面评价</h2>
                    </div>
                    {negativeReviews.length > 0 ? (
                        <div className="space-y-3">
                            {negativeReviews.map(review => (
                                <div key={review.id} className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{review.dish.name}</span>
                                        <Badge variant="destructive" className="text-xs">
                                            {review.sentiment?.toFixed(2)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{review.content}</p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {review.user.name} · {review.rating}星 · {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                            暂无负面评价
                        </div>
                    )}
                </div>

                {/* 热门菜品 TOP 5 占位 — 由服务端传入 */}
                <div className="rounded-xl border bg-card p-4">
                    <h2 className="font-semibold mb-4">管理员操作日志（最近）</h2>
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                        功能开发中
                    </div>
                </div>
            </div>
        </div>
    );
}
