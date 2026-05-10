import { createMethodHandler, successResponse, parsePagination, createPagination } from '@/lib/api/middleware';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache/redis';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';

export const GET = createMethodHandler({
    GET: async (request) => {
        const url = new URL(request.url);
        const campus = url.searchParams.get('campus') || undefined;
        const { page, pageSize, skip } = parsePagination(url);

        const result = await withCache(
            CacheKeys.canteen.list(campus),
            CacheTTL.MEDIUM,
            async () => {
                const where = {
                    deletedAt: null,
                    ...(campus && { campus: { code: campus } }),
                };

                const [canteens, total] = await Promise.all([
                    prisma.canteen.findMany({
                        where,
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
                        skip,
                        take: pageSize,
                    }),
                    prisma.canteen.count({ where }),
                ]);

                return { canteens, total };
            },
        );

        return successResponse(
            result.canteens,
            createPagination(page, pageSize, result.total),
        );
    },
});
