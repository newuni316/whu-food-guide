import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { prisma } from '@/lib/prisma';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const voteSchema = z.object({
    winnerId: z.string().min(1, 'winnerId 不能为空'),
    loserId: z.string().min(1, 'loserId 不能为空'),
});

const K_FACTOR = 32;

function calculateElo(winnerElo: number, loserElo: number): { newWinner: number; newLoser: number } {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

    return {
        newWinner: Math.round(winnerElo + K_FACTOR * (1 - expectedWinner)),
        newLoser: Math.round(loserElo + K_FACTOR * (0 - expectedLoser)),
    };
}

export const POST = createMethodHandler({
    POST: async (request) => {
        const body = validateRequest(voteSchema, await request.json());

        if (body.winnerId === body.loserId) {
            throw new ValidationError('不能投给自己');
        }

        const [winner, loser] = await Promise.all([
            prisma.restaurant.findUnique({ where: { id: body.winnerId } }),
            prisma.restaurant.findUnique({ where: { id: body.loserId } }),
        ]);

        if (!winner) throw new NotFoundError('餐厅', body.winnerId);
        if (!loser) throw new NotFoundError('餐厅', body.loserId);

        const { newWinner, newLoser } = calculateElo(winner.elo, loser.elo);

        await Promise.all([
            prisma.restaurant.update({
                where: { id: winner.id },
                data: { elo: newWinner, wins: winner.wins + 1, matches: winner.matches + 1 },
            }),
            prisma.restaurant.update({
                where: { id: loser.id },
                data: { elo: newLoser, matches: loser.matches + 1 },
            }),
        ]);

        const leaderboard = await prisma.restaurant.findMany({
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

        return successResponse({ leaderboard, winnerId: winner.id, loserId: loser.id });
    },
});
