import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

export async function GET() {
    const campuses = await prisma.campus.findMany({
        orderBy: { order: 'asc' },
    });
    return successResponse(campuses);
}
