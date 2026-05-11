import { prisma } from '@/lib/prisma';
import { withRole, successResponse } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';
import { logAdmin, invalidateDashboardCache } from '@/lib/admin-log';

export const dynamic = 'force-dynamic';

const PATCH = withRole('superadmin', async (request, context) => {
    const params = await context!.params!;
    const id = params.id;
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin', 'superadmin'].includes(role)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, '无效的角色');
    }

    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '用户不存在');

    const user = await prisma.user.update({
        where: { id },
        data: { role },
    });

    await logAdmin(request, 'update_user_role', id, { name: existing.name, from: existing.role, to: role });
    await invalidateDashboardCache();

    return successResponse({ id: user.id, role: user.role });
});

const DELETE = withRole('admin', async (request, context) => {
    const params = await context!.params!;
    const id = params.id;

    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '用户不存在');

    if (existing.role === 'superadmin') {
        throw new AppError(ErrorCode.FORBIDDEN, '无法禁用超级管理员');
    }

    await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    await logAdmin(request, 'delete_user', id, { name: existing.name, email: existing.email });
    await invalidateDashboardCache();

    return successResponse({ id });
});

export { PATCH, DELETE };
