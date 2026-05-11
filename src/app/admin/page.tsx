import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache/redis';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import { DashboardClient } from './components/dashboard-client';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // 并行获取所有数据（带 Redis 缓存）
    const [statsData, sentimentTrend, recommendationStats, negativeReviews] = await Promise.all([
        // 基础统计
        withCache(CacheKeys.admin.dashboardStats, CacheTTL.MEDIUM, async () => {
            const [canteenCount, dishCount, reviewCount, userCount] = await Promise.all([
                prisma.canteen.count({ where: { deletedAt: null } }),
                prisma.dish.count({ where: { deletedAt: null } }),
                prisma.review.count({ where: { deletedAt: null } }),
                prisma.user.count({ where: { deletedAt: null } }),
            ]);
            return [
                { label: '食堂', value: canteenCount, icon: 'UtensilsCrossed', color: 'text-blue-500' },
                { label: '菜品', value: dishCount, icon: 'TrendingUp', color: 'text-green-500' },
                { label: '评价', value: reviewCount, icon: 'MessageSquare', color: 'text-yellow-500' },
                { label: '用户', value: userCount, icon: 'Users', color: 'text-purple-500' },
            ];
        }),

        // 近30天情感趋势
        withCache(CacheKeys.admin.dashboardSentiment, CacheTTL.MEDIUM, async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const reviews = await prisma.review.findMany({
                where: {
                    deletedAt: null,
                    createdAt: { gte: thirtyDaysAgo },
                },
                select: { createdAt: true, sentiment: true },
                orderBy: { createdAt: 'asc' },
            });

            // 按日期分组
            const grouped: Record<string, { positive: number; negative: number; neutral: number }> = {};
            for (const r of reviews) {
                const date = r.createdAt.toISOString().split('T')[0];
                if (!grouped[date]) grouped[date] = { positive: 0, negative: 0, neutral: 0 };
                if (r.sentiment !== null && r.sentiment > 0.3) grouped[date].positive++;
                else if (r.sentiment !== null && r.sentiment < -0.3) grouped[date].negative++;
                else grouped[date].neutral++;
            }

            return Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, counts]) => ({ date: date.slice(5), ...counts }));
        }),

        // AI 推荐有效率
        withCache(CacheKeys.admin.dashboardRecommend, CacheTTL.MEDIUM, async () => {
            const [positive, negative, total] = await Promise.all([
                prisma.recommendationLog.count({ where: { feedback: 1 } }),
                prisma.recommendationLog.count({ where: { feedback: -1 } }),
                prisma.recommendationLog.count(),
            ]);
            return { positive, negative, total };
        }),

        // 待处理负面评价（最近5条）
        withCache(CacheKeys.admin.dashboardNegative, CacheTTL.MEDIUM, async () => {
            const reviews = await prisma.review.findMany({
                where: {
                    deletedAt: null,
                    sentiment: { lt: -0.3 },
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                    dish: { select: { name: true } },
                },
            });
            return reviews.map(r => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
            }));
        }),
    ]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">数据概览</h1>
            <DashboardClient
                stats={statsData}
                sentimentTrend={sentimentTrend}
                recommendationStats={recommendationStats}
                negativeReviews={negativeReviews}
            />
        </div>
    );
}
