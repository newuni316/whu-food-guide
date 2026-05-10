/**
 * 自定义错误类
 *
 * 提供统一的错误处理机制，支持错误码、HTTP 状态码、
 * 结构化错误信息，便于 API 层统一处理。
 */

/** 错误码枚举 */
export enum ErrorCode {
    // 通用
    UNKNOWN = 'UNKNOWN',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    CONFLICT = 'CONFLICT',
    RATE_LIMITED = 'RATE_LIMITED',

    // 数据库
    DATABASE_ERROR = 'DATABASE_ERROR',
    UNIQUE_CONSTRAINT = 'UNIQUE_CONSTRAINT',

    // AI
    AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
    EMBEDDING_ERROR = 'EMBEDDING_ERROR',
    VECTOR_SEARCH_ERROR = 'VECTOR_SEARCH_ERROR',

    // 缓存
    CACHE_ERROR = 'CACHE_ERROR',
}

/** HTTP 状态码映射 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
    [ErrorCode.UNKNOWN]: 500,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.RATE_LIMITED]: 429,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.UNIQUE_CONSTRAINT]: 409,
    [ErrorCode.AI_PROVIDER_ERROR]: 502,
    [ErrorCode.EMBEDDING_ERROR]: 500,
    [ErrorCode.VECTOR_SEARCH_ERROR]: 500,
    [ErrorCode.CACHE_ERROR]: 500,
};

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly details?: Record<string, unknown>;

    constructor(
        code: ErrorCode,
        message: string,
        details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = ERROR_STATUS_MAP[code] || 500;
        this.details = details;
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
            },
        };
    }
}

/** 参数校验错误 */
export class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(ErrorCode.VALIDATION_ERROR, message, details);
        this.name = 'ValidationError';
    }
}

/** 资源未找到 */
export class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string) {
        const msg = identifier
            ? `${resource} '${identifier}' 不存在`
            : `${resource} 不存在`;
        super(ErrorCode.NOT_FOUND, msg);
        this.name = 'NotFoundError';
    }
}

/** 未授权 */
export class UnauthorizedError extends AppError {
    constructor(message = '请先登录') {
        super(ErrorCode.UNAUTHORIZED, message);
        this.name = 'UnauthorizedError';
    }
}

/** 权限不足 */
export class ForbiddenError extends AppError {
    constructor(message = '权限不足') {
        super(ErrorCode.FORBIDDEN, message);
        this.name = 'ForbiddenError';
    }
}

/** AI 服务错误 */
export class AIError extends AppError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(ErrorCode.AI_PROVIDER_ERROR, message, details);
        this.name = 'AIError';
    }
}

/**
 * 统一错误处理 — 用于 API Route
 * 捕获错误并返回标准 JSON 响应
 */
export function handleApiError(error: unknown): Response {
    console.error('[API Error]', error);

    if (error instanceof AppError) {
        return Response.json(error.toJSON(), { status: error.statusCode });
    }

    // Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: Record<string, unknown> };
        if (prismaError.code === 'P2002') {
            const err = new AppError(
                ErrorCode.UNIQUE_CONSTRAINT,
                '数据已存在',
                prismaError.meta,
            );
            return Response.json(err.toJSON(), { status: 409 });
        }
        if (prismaError.code === 'P2025') {
            const err = new NotFoundError('记录');
            return Response.json(err.toJSON(), { status: 404 });
        }
    }

    // 未知错误
    const err = new AppError(
        ErrorCode.UNKNOWN,
        process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : (error as Error)?.message || '未知错误',
    );
    return Response.json(err.toJSON(), { status: 500 });
}
