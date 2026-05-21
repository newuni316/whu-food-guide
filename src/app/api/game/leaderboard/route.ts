import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const GET = createMethodHandler({
    GET: async () => {
        const restaurants = await prisma.restaurant.findMany({
            orderBy: { elo: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                address: true,
                price: true,
                tags: true,
                image: true,
                elo: true,
                wins: true,
                matches: true,
            },
        });

        return successResponse(restaurants);
    },
});
