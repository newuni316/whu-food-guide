import { prisma } from '@/lib/prisma';
import { withRole, successResponse } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';
import { logAdmin, invalidateDashboardCache } from '@/lib/admin-log';

export const dynamic = 'force-dynamic';

const DELETE = withRole('admin', async (request, context) => {
    const params = await context!.params!;
    const id = params.id;

    const existing = await prisma.review.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '评论不存在');

    await prisma.review.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    await logAdmin(request, 'delete_review', id, { dishId: existing.dishId });
    await invalidateDashboardCache();

    return successResponse({ id });
});

export { DELETE };
