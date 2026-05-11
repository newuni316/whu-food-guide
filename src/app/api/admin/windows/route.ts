import { prisma } from '@/lib/prisma';
import { withRole, successResponse, createMethodHandler } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

const GET = withRole('admin', async (request) => {
    const url = new URL(request.url);
    const canteenId = url.searchParams.get('canteenId') || '';

    const where: Record<string, unknown> = { deletedAt: null };
    if (canteenId) where.canteenId = canteenId;

    const windows = await prisma.window.findMany({
        where,
        include: { canteen: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
    });

    return successResponse(windows);
});

export { GET };
