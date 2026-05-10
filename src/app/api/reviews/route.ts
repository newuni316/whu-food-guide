import { createMethodHandler, successResponse, withAuth, parsePagination, createPagination } from '@/lib/api/middleware';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { analyzeSentiment } from '@/lib/ai/sentiment';
import { z } from 'zod';

const createReviewSchema = z.object({
    dishId: z.string().min(1, '请提供菜品ID'),
    canteenId: z.string().optional(),
    content: z.string().min(5, '评价至少5个字').max(500),
    rating: z.number().int().min(1).max(5),
    images: z.array(z.string().url()).max(9).optional(),
});

/** GET — 获取评价列表 */
export const GET = createMethodHandler({
    GET: async (request) => {
        const url = new URL(request.url);
        const dishId = url.searchParams.get('dishId') || undefined;
        const canteenId = url.searchParams.get('canteenId') || undefined;
        const sort = url.searchParams.get('sort') || 'new'; // new | hot | rating_high | rating_low
        const { page, pageSize, skip } = parsePagination(url);

        const where: Record<string, unknown> = { deletedAt: null };
        if (dishId) where.dishId = dishId;
        if (canteenId) where.canteenId = canteenId;

        let orderBy: Record<string, string>;
        switch (sort) {
            case 'hot': orderBy = { likes: 'desc' }; break;
            case 'rating_high': orderBy = { rating: 'desc' }; break;
            case 'rating_low': orderBy = { rating: 'asc' }; break;
            default: orderBy = { createdAt: 'desc' }; break;
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    dish: { select: { id: true, name: true } },
                    _count: { select: { replies: true } },
                },
                orderBy,
                skip,
                take: pageSize,
            }),
            prisma.review.count({ where }),
        ]);

        return successResponse(
            reviews,
            createPagination(page, pageSize, total),
        );
    },
});

/** POST — 创建评价 */
export const POST = createMethodHandler({
    POST: withAuth(async (request) => {
        const session = (request as Request & { session: { user: { id: string } } }).session;
        const userId = session.user.id;
        const body = await request.json();

        const parsed = createReviewSchema.safeParse(body);
        if (!parsed.success) {
            throw new ValidationError(parsed.error.issues[0]?.message || '参数校验失败');
        }

        const { dishId, canteenId, content, rating, images } = parsed.data;

        // 检查菜品是否存在
        const dish = await prisma.dish.findUnique({ where: { id: dishId } });
        if (!dish) throw new NotFoundError('菜品');

        // 情感分析
        const sentimentResult = await analyzeSentiment(content);

        const review = await prisma.review.create({
            data: {
                content,
                rating,
                images: images || [],
                sentiment: sentimentResult.sentiment,
                keywords: sentimentResult.keywords,
                userId,
                dishId,
                canteenId: canteenId || null,
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
            },
        });

        // 更新菜品评分
        const stats = await prisma.review.aggregate({
            where: { dishId, deletedAt: null },
            _avg: { rating: true },
            _count: true,
        });

        await prisma.dish.update({
            where: { id: dishId },
            data: {
                avgRating: stats._avg.rating || 0,
                reviewCount: stats._count,
            },
        });

        return successResponse(review, undefined, 201);
    }),
});
