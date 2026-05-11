/**
 * API 限流模块
 *
 * 基于 Redis 的固定窗口限流，防止 AI 接口被滥用。
 * Redis 不可用时自动放行（graceful degradation）。
 */

import { getRedis } from './redis';

/** 限流结果 */
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetSeconds: number;
}

/**
 * 检查请求是否超过限流阈值
 *
 * @param key - 限流键（如 IP 地址或用户 ID）
 * @param limit - 窗口内允许的最大请求数
 * @param windowSeconds - 时间窗口大小（秒）
 * @returns 限流结果，包含是否允许、剩余次数、重置时间
 */
export async function checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
): Promise<RateLimitResult> {
    const client = getRedis();

    // Redis 不可用时放行
    if (!client) {
        return { allowed: true, remaining: limit, limit, resetSeconds: windowSeconds };
    }

    try {
        const now = Math.floor(Date.now() / 1000);
        const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
        const windowKey = `ratelimit:${key}:${windowStart}`;

        const count = await client.incr(windowKey);
        if (count === 1) {
            await client.expire(windowKey, windowSeconds);
        }

        const resetSeconds = windowSeconds - (now - windowStart);

        return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
            limit,
            resetSeconds,
        };
    } catch {
        // Redis 操作失败时放行
        return { allowed: true, remaining: limit, limit, resetSeconds: windowSeconds };
    }
}

/**
 * 从请求中提取客户端 IP
 *
 * 优先使用 Vercel 专用头（不可伪造），其次取 x-forwarded-for 最后一个可信代理 IP。
 */
export function getClientIp(request: Request): string {
    // Vercel 环境：专用头由边缘网络注入，不可被客户端伪造
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp) {
        return vercelIp.split(',')[0]?.trim() || 'unknown';
    }

    // x-forwarded-for 可能被客户端伪造，取最后一个代理 IP（最接近服务端）
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const parts = forwarded.split(',').map(s => s.trim()).filter(Boolean);
        // 最后一个 IP 通常是离服务端最近的可信代理
        return parts[parts.length - 1] || 'unknown';
    }

    return (
        request.headers.get('x-real-ip') ||
        'unknown'
    );
}
