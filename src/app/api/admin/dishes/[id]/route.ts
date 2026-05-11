import { prisma } from '@/lib/prisma';
import { withRole, successResponse } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';
import { logAdmin, invalidateDashboardCache } from '@/lib/admin-log';

export const dynamic = 'force-dynamic';

const PUT = withRole('admin', async (request, context) => {
    const params = await context!.params!;
    const id = params.id;
    const body = await request.json();
    const { name, windowId, price, description, category, tags, calories, protein, fat, carbs, isAvailable } = body;

    const existing = await prisma.dish.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '菜品不存在');

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (windowId !== undefined) data.windowId = windowId;
    if (price !== undefined) data.price = parseFloat(price);
    if (description !== undefined) data.description = description || null;
    if (category !== undefined) data.category = category;
    if (tags !== undefined) data.tags = tags;
    if (calories !== undefined) data.calories = calories ? parseInt(calories) : null;
    if (protein !== undefined) data.protein = protein ? parseFloat(protein) : null;
    if (fat !== undefined) data.fat = fat ? parseFloat(fat) : null;
    if (carbs !== undefined) data.carbs = carbs ? parseFloat(carbs) : null;
    if (isAvailable !== undefined) data.isAvailable = isAvailable;

    const dish = await prisma.dish.update({
        where: { id },
        data,
        include: {
            window: { include: { canteen: { include: { campus: true } } } },
        },
    });

    await logAdmin(request, 'update_dish', id, { name: dish.name });
    await invalidateDashboardCache();

    // TODO: 内容变更后触发 DishEmbedding 重新生成
    // if (name !== undefined || description !== undefined || category !== undefined) {
    //     await generateDishEmbedding(id);
    // }

    return successResponse(dish);
});

const DELETE = withRole('admin', async (request, context) => {
    const params = await context!.params!;
    const id = params.id;

    const existing = await prisma.dish.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '菜品不存在');

    await prisma.dish.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    await logAdmin(request, 'delete_dish', id, { name: existing.name });
    await invalidateDashboardCache();

    return successResponse({ id });
});

export { PUT, DELETE };
