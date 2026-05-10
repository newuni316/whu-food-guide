import { prisma } from '@/lib/prisma';
import { withRole, successResponse, createMethodHandler } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const GET = withRole('admin', async (request) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';

    const where = search
        ? {
            deletedAt: null,
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { slug: { contains: search, mode: 'insensitive' as const } },
            ],
        }
        : { deletedAt: null };

    const canteens = await prisma.canteen.findMany({
        where,
        include: {
            campus: true,
            _count: { select: { windows: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return successResponse(canteens);
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

    return successResponse(canteen, undefined, 201);
});

export { GET, POST };
