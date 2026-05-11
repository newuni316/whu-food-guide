import { prisma } from '@/lib/prisma';
import { withRole, successResponse, createPagination, parsePagination, createMethodHandler } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const GET = withRole('admin', async (request) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const windowId = url.searchParams.get('windowId') || '';
    const category = url.searchParams.get('category') || '';
    const { page, pageSize, skip } = parsePagination(url);

    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' as const } },
        ];
    }
    if (windowId) where.windowId = windowId;
    if (category) where.category = category;

    const [dishes, total] = await Promise.all([
        prisma.dish.findMany({
            where,
            include: {
                window: {
                    include: { canteen: { include: { campus: true } } },
                },
                _count: { select: { reviews: true, favorites: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.dish.count({ where }),
    ]);

    return successResponse(dishes, createPagination(page, pageSize, total));
});

const POST = withRole('admin', async (request) => {
    const body = await request.json();
    const { name, windowId, price, description, category, tags, calories, protein, fat, carbs, isAvailable } = body;

    if (!name || !windowId || price == null) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, '缺少必填字段：name, windowId, price');
    }

    const window = await prisma.window.findFirst({ where: { id: windowId, deletedAt: null } });
    if (!window) throw new AppError(ErrorCode.NOT_FOUND, '窗口不存在');

    const dish = await prisma.dish.create({
        data: {
            name,
            windowId,
            price: parseFloat(price),
            description: description || null,
            category: category || '其他',
            tags: tags || [],
            calories: calories ? parseInt(calories) : null,
            protein: protein ? parseFloat(protein) : null,
            fat: fat ? parseFloat(fat) : null,
            carbs: carbs ? parseFloat(carbs) : null,
            isAvailable: isAvailable !== false,
            images: [],
        },
        include: {
            window: { include: { canteen: true } },
        },
    });

    return successResponse(dish, undefined, 201);
});

export { GET, POST };
