import { prisma } from '@/lib/prisma';
import { UtensilsCrossed, MessageSquare, Users, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const [canteenCount, dishCount, reviewCount, userCount] = await Promise.all([
        prisma.canteen.count({ where: { deletedAt: null } }),
        prisma.dish.count({ where: { deletedAt: null } }),
        prisma.review.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null } }),
    ]);

    const recentReviews = await prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true } },
            dish: { select: { name: true } },
        },
    });

    const topDishes = await prisma.dish.findMany({
        take: 5,
        where: { deletedAt: null, isAvailable: true },
        orderBy: { avgRating: 'desc' },
        include: {
            window: { include: { canteen: true } },
        },
    });

    const stats = [
        { label: '食堂', value: canteenCount, icon: UtensilsCrossed, color: 'text-blue-500' },
        { label: '菜品', value: dishCount, icon: TrendingUp, color: 'text-green-500' },
        { label: '评价', value: reviewCount, icon: MessageSquare, color: 'text-yellow-500' },
        { label: '用户', value: userCount, icon: Users, color: 'text-purple-500' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">数据概览</h1>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="rounded-xl border bg-card p-4">
                            <div className="flex items-center gap-3">
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                                <span className="text-sm text-muted-foreground">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-bold mt-2">{stat.value}</div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 最新评价 */}
                <div className="rounded-xl border bg-card p-4">
                    <h2 className="font-semibold mb-4">最新评价</h2>
                    <div className="space-y-3">
                        {recentReviews.map(review => (
                            <div key={review.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {review.dish.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {review.content}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {review.user.name} · {review.rating}星
                                    </div>
                                </div>
                                {review.sentiment !== null && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        review.sentiment > 0 ? 'bg-green-100 text-green-700' :
                                        review.sentiment < 0 ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {review.sentiment > 0 ? '正面' : review.sentiment < 0 ? '负面' : '中性'}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 热门菜品 */}
                <div className="rounded-xl border bg-card p-4">
                    <h2 className="font-semibold mb-4">热门菜品 TOP 5</h2>
                    <div className="space-y-3">
                        {topDishes.map((dish, i) => (
                            <div key={dish.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    i === 0 ? 'bg-yellow-400 text-white' :
                                    i === 1 ? 'bg-gray-300 text-white' :
                                    i === 2 ? 'bg-orange-400 text-white' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">{dish.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {dish.window?.canteen?.name}
                                    </div>
                                </div>
                                <div className="text-sm font-medium">
                                    {dish.avgRating.toFixed(1)}分
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
