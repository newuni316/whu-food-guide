/**
 * Redis 客户端单例
 *
 * 使用 ioredis 连接 Redis，支持缓存、排行榜、会话存储。
 * 开发环境连接失败时 graceful degradation（降级为无缓存模式）。
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let connectionFailed = false;

// 进程退出时清理连接
if (typeof process !== 'undefined') {
    const cleanup = () => {
        if (redis) {
            redis.quit().catch(() => {});
            redis = null;
        }
    };
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('beforeExit', cleanup);
}

function createRedisClient(): Redis | null {
    if (connectionFailed) return null;

    try {
        const client = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 3) {
                    connectionFailed = true;
                    console.warn('[Redis] 连接失败，降级为无缓存模式');
                    return null; // 停止重试
                }
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });

        client.on('error', (err) => {
            if (!connectionFailed) {
                console.warn('[Redis] 连接错误:', err.message);
            }
        });

        client.on('connect', () => {
            connectionFailed = false;
        });

        return client;
    } catch {
        connectionFailed = true;
        console.warn('[Redis] 初始化失败，降级为无缓存模式');
        return null;
    }
}

/**
 * 获取 Redis 客户端实例
 * 连接失败时返回 null，调用方需做 null check
 */
export function getRedis(): Redis | null {
    if (!redis) {
        redis = createRedisClient();
    }
    return redis;
}

/**
 * 带缓存的查询封装
 * Redis 不可用时直接执行查询函数
 */
export async function withCache<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
): Promise<T> {
    const client = getRedis();

    if (!client) {
        return fetcher();
    }

    try {
        const cached = await client.get(key);
        if (cached) {
            return JSON.parse(cached) as T;
        }
    } catch {
        // 缓存读取失败，降级到直接查询
    }

    const result = await fetcher();

    try {
        await client.setex(key, ttlSeconds, JSON.stringify(result));
    } catch {
        // 缓存写入失败，不影响返回
    }

    return result;
}

/**
 * 删除缓存键
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
    const client = getRedis();
    if (!client || keys.length === 0) return;

    try {
        await client.del(...keys);
    } catch {
        // 忽略删除失败
    }
}

/**
 * 批量删除匹配模式的缓存键（使用 SCAN 迭代，避免 KEYS 阻塞）
 */
export async function invalidatePattern(pattern: string): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await client.del(...keys);
            }
        } while (cursor !== '0');
    } catch {
        // 忽略
    }
}
