import { prisma } from '@/lib/prisma';
import { withRole, successResponse, parsePagination, createPagination } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const GET = withRole('admin', async (request) => {
    const url = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(url);
    const role = url.searchParams.get('role');
    const search = url.searchParams.get('search');

    const where: Record<string, unknown> = { deletedAt: null };
    if (role) where.role = role;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
                profile: true,
                _count: { select: { reviews: true, favorites: true } },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return successResponse(users, createPagination(page, pageSize, total));
});

export { GET };
