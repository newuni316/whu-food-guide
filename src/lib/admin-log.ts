/**
 * 管理员操作日志工具
 *
 * 在所有管理员写操作中记录操作日志，便于审计追踪。
 * 同时在写操作后失效相关的 Dashboard 缓存。
 */

import { prisma } from '@/lib/prisma';
import { invalidatePattern } from '@/lib/cache/redis';
import type { AuthenticatedRequest } from '@/lib/api/middleware';

/**
 * 记录管理员操作日志
 *
 * @param request - 已认证的请求（含 session）
 * @param action  - 操作类型，如 "create_canteen", "delete_dish", "update_user_role"
 * @param target  - 操作目标标识，如食堂 ID、菜品名称
 * @param detail  - 附加信息（可选）
 */
export async function logAdmin(
    request: AuthenticatedRequest,
    action: string,
    target?: string,
    detail?: Record<string, unknown>,
): Promise<void> {
    try {
        const adminId = request.session.user.id;
        if (!adminId) return;

        await prisma.adminLog.create({
            data: {
                adminId,
                action,
                target: target || null,
                detail: detail ? JSON.parse(JSON.stringify(detail)) : undefined,
            },
        });
    } catch {
        // 日志写入失败不影响业务
    }
}

/**
 * 失效管理后台 Dashboard 缓存
 *
 * 在食堂/菜品/评价/用户数据变更后调用，确保 Dashboard 数据实时。
 */
export async function invalidateDashboardCache(): Promise<void> {
    await invalidatePattern('admin:dashboard:*');
}
