import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/errors';
import { getRecommendation } from '@/lib/ai/recommender';
import type { RecommendRequest } from '@/types';

export const dynamic = 'force-dynamic';

export const POST = createMethodHandler({
    POST: async (request) => {
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
