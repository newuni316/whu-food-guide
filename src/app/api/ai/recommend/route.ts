import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/errors';
import { getRecommendation } from '@/lib/ai/recommender';
import { checkRateLimit, getClientIp } from '@/lib/cache/rate-limit';
import type { RecommendRequest } from '@/types';

export const dynamic = 'force-dynamic';

export const POST = createMethodHandler({
    POST: async (request) => {
        // 限流：每 IP 每分钟 20 次
        const ip = getClientIp(request);
        const rateLimit = await checkRateLimit(`ai:recommend:${ip}`, 20, 60);
        if (!rateLimit.allowed) {
            return Response.json(
                { success: false, error: '请求过于频繁，请稍后再试' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.resetSeconds),
                        'X-RateLimit-Limit': String(rateLimit.limit),
                        'X-RateLimit-Remaining': '0',
                    },
                },
            );
        }

        const body: RecommendRequest = await request.json();

        if (!body.query || typeof body.query !== 'string') {
            throw new ValidationError('请提供查询内容');
        }

        // 获取用户 ID（如果已登录）
        const session = (request as Request & { session?: { user?: { id?: string } } }).session;
        const userId = session?.user?.id;

        const result = await getRecommendation(body, userId);

        return successResponse(result);
    },
});
