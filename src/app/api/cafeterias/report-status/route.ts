import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { prisma } from '@/lib/prisma';
import { NotFoundError, AppError, ErrorCode } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/cache/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const STATUS_MAP: Record<string, number> = {
    busy: 80,
    normal: 40,
    empty: 10,
};

const reportSchema = z.object({
    canteenId: z.string().min(1, 'canteenId 不能为空'),
    status: z.enum(['busy', 'normal', 'empty'], {
        errorMap: () => ({ message: 'status 必须是 busy / normal / empty 之一' }),
    }),
});

export const POST = createMethodHandler({
    POST: async (request) => {
        const ip = getClientIp(request);
        const rateLimit = await checkRateLimit(`canteen:report:${ip}`, 1, 60);
        if (!rateLimit.allowed) {
            throw new AppError(ErrorCode.RATE_LIMITED, '提交过于频繁，请1分钟后再试');
        }

        const body = validateRequest(reportSchema, await request.json());

        const canteen = await prisma.canteen.findUnique({ where: { id: body.canteenId } });
        if (!canteen || canteen.deletedAt) {
            throw new NotFoundError('食堂', body.canteenId);
        }

        const queueIndex = STATUS_MAP[body.status];

        await prisma.canteen.update({
            where: { id: body.canteenId },
            data: { queueIndex },
        });

        return successResponse({
            canteenId: body.canteenId,
            queueIndex,
            status: body.status,
        });
    },
});
