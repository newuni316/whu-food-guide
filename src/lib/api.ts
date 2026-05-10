/**
 * 服务端 API 封装
 *
 * 提供给 Server Components 使用的数据获取函数。
 * 使用新的模型名称（Canteen/Window/Dish）。
 */

import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache/redis';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';

/**
 * 获取所有食堂（含窗口和招牌菜品）
 */
export async function getCanteens(campus?: string) {
    return withCache(
        CacheKeys.canteen.list(campus),
        CacheTTL.MEDIUM,
        async () => {
            return prisma.canteen.findMany({
                where: {
                    deletedAt: null,
                    ...(campus && { campus: { code: campus } }),
                },
                include: {
                    campus: true,
                    windows: {
                        where: { deletedAt: null },
                        include: {
                            dishes: {
                                where: { deletedAt: null, isAvailable: true },
                                take: 3,
                                orderBy: { avgRating: 'desc' },
                            },
                        },
                    },
                },
                orderBy: { avgRating: 'desc' },
            });
        },
    );
}

/** @deprecated 使用 getCanteens() */
export const getCafeterias = getCanteens;

/**
 * 根据 slug 获取食堂详情
 */
export async function getCanteenBySlug(slug: string) {
    return withCache(
        CacheKeys.canteen.detail(slug),
        CacheTTL.MEDIUM,
        async () => {
            return prisma.canteen.findFirst({
                where: { slug, deletedAt: null },
                include: {
                    campus: true,
                    windows: {
                        where: { deletedAt: null },
                        include: {
                            dishes: {
                                where: { deletedAt: null },
                                orderBy: { avgRating: 'desc' },
                            },
                        },
                    },
                    reviews: {
                        where: { deletedAt: null },
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            user: { select: { id: true, name: true, image: true } },
                        },
                    },
                },
            });
        },
    );
}

/** @deprecated 使用 getCanteenBySlug() */
export const getCafeteriaBySlug = getCanteenBySlug;

/**
 * 获取排行榜
 */
export async function getRankings(type = 'daily') {
    const period = new Date().toISOString().split('T')[0];
    return withCache(
        CacheKeys.ranking.byType(type, period),
        CacheTTL.RANKING,
        async () => {
            return prisma.ranking.findMany({
                where: { type, period },
                orderBy: { score: 'desc' },
                take: 10,
                include: {
                    canteen: {
                        include: { campus: true },
                    },
                },
            });
        },
    );
}
