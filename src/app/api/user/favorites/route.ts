import { createMethodHandler, successResponse, withAuth, parsePagination, createPagination } from '@/lib/api/middleware';
import { ValidationError, AppError, ErrorCode } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { invalidateCache } from '@/lib/cache/redis';
import { CacheKeys } from '@/lib/cache/keys';
import { z } from 'zod';

const addFavoriteSchema = z.object({
    dishId: z.string().min(1, '请提供菜品ID'),
});

/** GET — 获取收藏列表 */
export const GET = createMethodHandler({
    GET: withAuth(async (request) => {
        const userId = request.session.user.id;
        const { page, pageSize, skip } = parsePagination(new URL(request.url));

        const [favorites, total] = await Promise.all([
            prisma.favorite.findMany({
                where: { userId },
                include: {
                    dish: {
                        include: {
                            window: { include: { canteen: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.favorite.count({ where: { userId } }),
        ]);

        return successResponse(
            favorites.map(f => ({
                id: f.id,
                createdAt: f.createdAt,
                dish: f.dish,
            })),
            createPagination(page, pageSize, total),
        );
    }),
});

/** POST — 添加收藏 */
export const POST = createMethodHandler({
    POST: withAuth(async (request) => {
        const userId = request.session.user.id;
        const body = await request.json();

        const parsed = addFavoriteSchema.safeParse(body);
        if (!parsed.success) {
            throw new ValidationError(parsed.error.issues[0]?.message || '参数校验失败');
        }

        const { dishId } = parsed.data;

        // 检查菜品是否存在
        const dish = await prisma.dish.findUnique({ where: { id: dishId } });
        if (!dish) throw new AppError(ErrorCode.NOT_FOUND, '菜品不存在');

        // 检查是否已收藏
        const existing = await prisma.favorite.findUnique({
            where: { userId_dishId: { userId, dishId } },
        });
        if (existing) throw new AppError(ErrorCode.CONFLICT, '已收藏该菜品');

        const favorite = await prisma.favorite.create({
            data: { userId, dishId },
        });

        await invalidateCache(CacheKeys.user.favorites(userId));

        return successResponse(favorite, undefined, 201);
    }),
});

/** DELETE — 取消收藏 */
export const DELETE = createMethodHandler({
    DELETE: withAuth(async (request) => {
        const userId = request.session.user.id;
        const url = new URL(request.url);
        const dishId = url.searchParams.get('dishId');

        if (!dishId) throw new ValidationError('请提供菜品ID');

        const existing = await prisma.favorite.findUnique({
            where: { userId_dishId: { userId, dishId } },
        });
        if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '未收藏该菜品');

        await prisma.favorite.delete({
            where: { userId_dishId: { userId, dishId } },
        });

        await invalidateCache(CacheKeys.user.favorites(userId));

        return successResponse({ success: true });
    }),
});
