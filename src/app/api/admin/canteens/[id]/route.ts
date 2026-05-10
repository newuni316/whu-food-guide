import { prisma } from '@/lib/prisma';
import { withRole, successResponse } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const PUT = withRole('admin', async (request, context) => {
    const params = await context!.params!;
    const id = params.id;
    const body = await request.json();
    const { name, slug, campusId, address, latitude, longitude, phone, description, isOpen } = body;

    const existing = await prisma.canteen.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '食堂不存在');

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (campusId !== undefined) data.campusId = campusId;
    if (address !== undefined) data.address = address;
    if (latitude !== undefined) data.latitude = parseFloat(latitude);
    if (longitude !== undefined) data.longitude = parseFloat(longitude);
    if (phone !== undefined) data.phone = phone || null;
    if (description !== undefined) data.description = description || null;
    if (isOpen !== undefined) data.isOpen = isOpen;

    const canteen = await prisma.canteen.update({
        where: { id },
        data,
        include: { campus: true },
    });

    return successResponse(canteen);
});

const DELETE = withRole('admin', async (request, context) => {
    const params = await context!.params!;
    const id = params.id;

    const existing = await prisma.canteen.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '食堂不存在');

    await prisma.canteen.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    return successResponse({ id });
});

export { PUT, DELETE };
