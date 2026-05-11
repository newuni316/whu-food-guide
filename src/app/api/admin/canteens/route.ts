import { prisma } from '@/lib/prisma';
import { withRole, successResponse, createPagination, parsePagination } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';
import { logAdmin, invalidateDashboardCache } from '@/lib/admin-log';

export const dynamic = 'force-dynamic';

const GET = withRole('admin', async (request) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const campusId = url.searchParams.get('campusId') || '';
    const { page, pageSize, skip } = parsePagination(url);

    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
        ];
    }
    if (campusId) where.campusId = campusId;

    const [canteens, total] = await Promise.all([
        prisma.canteen.findMany({
            where,
            include: {
                campus: true,
                _count: { select: { windows: true, reviews: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.canteen.count({ where }),
    ]);

    return successResponse(canteens, createPagination(page, pageSize, total));
});

const POST = withRole('admin', async (request) => {
    const body = await request.json();
    const { name, slug, campusId, address, latitude, longitude, phone, description, isOpen } = body;

    if (!name || !slug || !campusId || !address || latitude == null || longitude == null) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, '缺少必填字段');
    }

    const canteen = await prisma.canteen.create({
        data: {
            name,
            slug,
            campusId,
            address,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            phone: phone || null,
            description: description || null,
            isOpen: isOpen !== false,
            hours: {},
            images: [],
            tags: [],
        },
        include: { campus: true },
    });

    await logAdmin(request, 'create_canteen', canteen.id, { name, slug });
    await invalidateDashboardCache();

    return successResponse(canteen, undefined, 201);
});

export { GET, POST };
