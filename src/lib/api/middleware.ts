/**
 * API 中间件
 *
 * 提供统一的 API 请求处理管道：
 * 认证 → 校验 → 业务逻辑 → 响应
 */

import { auth } from '@/lib/auth';
import { AppError, ErrorCode, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { ApiResponse, Pagination } from '@/types';
import type { Session } from 'next-auth';

/** 携带已验证 session 的请求 */
export interface AuthenticatedRequest extends Request {
    session: Session;
}

type RouteHandler = (
    request: Request,
    context?: { params?: Record<string, string> | Promise<Record<string, string>> },
) => Promise<Response>;

type AuthenticatedRouteHandler = (
    request: AuthenticatedRequest,
    context?: { params?: Record<string, string> | Promise<Record<string, string>> },
) => Promise<Response>;

/**
 * 构建成功响应
 */
export function successResponse<T>(
    data: T,
    pagination?: Pagination,
    status = 200,
): Response {
    const body: ApiResponse<T> = {
        success: true,
        data,
        ...(pagination && { pagination }),
    };
    return Response.json(body, { status });
}

/**
 * 构建分页
 */
export function createPagination(
    page: number,
    pageSize: number,
    total: number,
): Pagination {
    return {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * 解析分页参数
 */
export function parsePagination(url: URL): { page: number; pageSize: number; skip: number } {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
    return { page, pageSize, skip: (page - 1) * pageSize };
}

/**
 * 类型安全的 session 获取
 */
export async function getSession(): Promise<Session> {
    const session = await auth();
    if (!session?.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, '请先登录');
    }
    return session;
}

/**
 * 认证中间件 — 要求登录
 */
export function withAuth(handler: AuthenticatedRouteHandler): RouteHandler {
    return async (request, context) => {
        try {
            const session = await getSession();
            // 使用 Object.assign 保留原始 request，附加类型安全的 session
            const authReq = Object.assign(request, { session }) as AuthenticatedRequest;
            return await handler(authReq, context);
        } catch (error) {
            return handleApiError(error);
        }
    };
}

/**
 * 角色中间件 — 要求特定角色
 */
export function withRole(role: 'admin' | 'superadmin', handler: AuthenticatedRouteHandler): RouteHandler {
    return withAuth(async (request, context) => {
        if (request.session.user.role !== role && request.session.user.role !== 'superadmin') {
            throw new AppError(ErrorCode.FORBIDDEN, '需要管理员权限');
        }
        return handler(request, context);
    });
}

/**
 * 错误处理包装器 — 统一捕获异常
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
    return async (request, context) => {
        const startTime = performance.now();
        try {
            const response = await handler(request, context);
            const duration = Math.round(performance.now() - startTime);
            logger.info(
                `${request.method} ${new URL(request.url).pathname} ${response.status} ${duration}ms`,
                'api',
            );
            return response;
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            logger.error(
                `${request.method} ${new URL(request.url).pathname} error ${duration}ms`,
                'api',
                { error: (error as Error)?.message },
            );
            return handleApiError(error);
        }
    };
}

/**
 * 方法路由 — 根据 HTTP 方法分发
 */
export function createMethodHandler(handlers: {
    GET?: RouteHandler;
    POST?: RouteHandler;
    PUT?: RouteHandler;
    DELETE?: RouteHandler;
    PATCH?: RouteHandler;
}) {
    return withErrorHandling(async (request, context) => {
        const method = request.method.toUpperCase() as keyof typeof handlers;
        const handler = handlers[method];

        if (!handler) {
            return Response.json(
                { success: false, error: `Method ${method} not allowed` },
                { status: 405 },
            );
        }

        return handler(request, context);
    });
}
