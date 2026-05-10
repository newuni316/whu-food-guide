import { createMethodHandler, successResponse, parsePagination, createPagination } from '@/lib/api/middleware';
import { semanticSearch, toSearchResults } from '@/lib/ai/vector-search';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache/redis';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import type { SearchParams, SearchResult } from '@/types';

export const GET = createMethodHandler({
    GET: async (request) => {
        const url = new URL(request.url);
        const params: SearchParams = {
            q: url.searchParams.get('q') || undefined,
            campus: url.searchParams.get('campus') || undefined,
            category: url.searchParams.get('category') || undefined,
            priceMin: url.searchParams.get('priceMin') ? Number(url.searchParams.get('priceMin')) : undefined,
            priceMax: url.searchParams.get('priceMax') ? Number(url.searchParams.get('priceMax')) : undefined,
            tags: url.searchParams.get('tags')?.split(',').filter(Boolean),
            sort: (url.searchParams.get('sort') as SearchParams['sort']) || 'rating',
            ...parsePagination(url),
        };

        // 有语义查询时使用向量搜索
        if (params.q && params.q.length > 0) {
            const cacheKey = CacheKeys.search.semantic(params.q);
            const results = await withCache(cacheKey, CacheTTL.SEARCH, async () => {
                const vectorResults = await semanticSearch(params.q!, 20, {
                    campus: params.campus,
                    priceMax: params.priceMax,
                });
                return toSearchResults(vectorResults);
            });

            return successResponse(results, createPagination(params.page!, params.pageSize!, results.length));
        }

        // 无查询时使用结构化筛选
        const where: Record<string, unknown> = {
            deletedAt: null,
            isAvailable: true,
        };

        if (params.campus) {
            where.window = { canteen: { campus: { code: params.campus } } };
        }

        if (params.category) {
            where.category = params.category;
        }

        if (params.priceMin || params.priceMax) {
            where.price = {
                ...(params.priceMin && { gte: params.priceMin }),
                ...(params.priceMax && { lte: params.priceMax }),
            };
        }

        if (params.tags && params.tags.length > 0) {
            where.tags = { hasSome: params.tags };
        }

        // 排序
        const orderBy: Record<string, string> = {};
        switch (params.sort) {
            case 'price': orderBy.price = 'asc'; break;
            case 'hot': orderBy.reviewCount = 'desc'; break;
            case 'new': orderBy.createdAt = 'desc'; break;
            default: orderBy.avgRating = 'desc'; break;
        }

        const [dishes, total] = await Promise.all([
            prisma.dish.findMany({
                where,
                include: {
                    window: { include: { canteen: true } },
                },
                orderBy,
                skip: params.skip,
                take: params.pageSize,
            }),
            prisma.dish.count({ where }),
        ]);

        const results: SearchResult[] = dishes.map(dish => ({
            type: 'dish' as const,
            id: dish.id,
            name: dish.name,
            description: dish.description ?? undefined,
            price: dish.price,
            rating: dish.avgRating,
            tags: dish.tags,
            canteenName: dish.window?.canteen?.name,
        }));

        return successResponse(results, createPagination(params.page!, params.pageSize!, total));
    },
});
