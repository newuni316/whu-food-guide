import { prisma } from '@/lib/prisma';
import { withRole, successResponse, parsePagination, createPagination } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const GET = withRole('admin', async (request) => {
    const url = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(url);
    const sentiment = url.searchParams.get('sentiment');

    const where: Record<string, unknown> = { deletedAt: null };
    if (sentiment === 'positive') where.sentiment = { gt: 0.3 };
    else if (sentiment === 'negative') where.sentiment = { lt: -0.3 };
    else if (sentiment === 'neutral') where.sentiment = { gte: -0.3, lte: 0.3 };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                dish: { select: { id: true, name: true } },
            },
        }),
        prisma.review.count({ where }),
    ]);

    return successResponse(reviews, createPagination(page, pageSize, total));
});

export { GET };
