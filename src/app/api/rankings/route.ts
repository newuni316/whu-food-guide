import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache/redis';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import type { RankingType } from '@/types';

export const GET = createMethodHandler({
    GET: async (request) => {
        const url = new URL(request.url);
        const type = (url.searchParams.get('type') || 'daily') as RankingType;
        const period = url.searchParams.get('period') || new Date().toISOString().split('T')[0];

        const rankings = await withCache(
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

        return successResponse(rankings);
    },
});
