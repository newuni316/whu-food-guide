/**
 * 健康检查端点
 *
 * 返回数据库、Redis 连接状态。
 * 用于 Docker、负载均衡器、监控系统健康检查。
 */

import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: {
        database: 'ok' | 'error';
        redis: 'ok' | 'error' | 'disabled';
    };
    version: string;
    uptime: number;
}

const startTime = Date.now();

export async function GET() {
    const checks = await Promise.allSettled([
        // 数据库检查
        prisma.$queryRaw`SELECT 1`.then(() => 'ok' as const),
        // Redis 检查
        (async () => {
            const redis = getRedis();
            if (!redis) return 'disabled' as const;
            await redis.ping();
            return 'ok' as const;
        })(),
    ]);

    const dbStatus = checks[0].status === 'fulfilled' ? checks[0].value : 'error';
    const redisStatus = checks[1].status === 'fulfilled' ? checks[1].value : 'error';

    const isHealthy = dbStatus === 'ok';
    const isDegraded = dbStatus === 'ok' && redisStatus === 'error';

    const body: HealthStatus = {
        status: isHealthy ? (isDegraded ? 'degraded' : 'healthy') : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
            database: dbStatus,
            redis: redisStatus,
        },
        version: process.env.npm_package_version || '2.0.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
    };

    return Response.json(body, {
        status: isHealthy ? 200 : 503,
    });
}
