import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import type { DishSummary, RecommendResult } from '@/types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const recommendSchema = z.object({
    dietTags: z.array(z.string()).default([]),
    budget: z.number().positive().optional(),
    campus: z.string().optional(),
    limit: z.number().min(1).max(30).default(10),
    excludeIds: z.array(z.string()).default([]),
});

function generateReason(dish: { price: number; avgRating: number; tags: string[] }, dietTags: string[]): string {
    const reasons: string[] = [];

    if (dish.avgRating >= 4.5) reasons.push('口碑很好');
    if (dish.avgRating >= 4.0) reasons.push('广受好评');
    if (dish.price <= 10) reasons.push('实惠便宜');
    if (dish.price <= 20 && dish.price > 10) reasons.push('价格适中');

    const matched = dietTags.filter(t => dish.tags.includes(t));
    if (matched.length > 0) reasons.push(`符合${matched.slice(0, 2).join('、')}需求`);

    if (dish.tags.includes('推荐')) reasons.push('热门推荐');
    if (dish.tags.includes('辣')) reasons.push('爱吃辣必试');

    return reasons.join('，') || '值得一试';
}

function findMatchingTags(dishTags: string[], dietTags: string[]): string[] {
    return dietTags.filter(t => dishTags.includes(t));
}

export const POST = createMethodHandler({
    POST: async (request) => {
        const body = validateRequest(recommendSchema, await request.json());
        const dietTags = body.dietTags as string[];
        const excludeIds = body.excludeIds as string[];
        const { budget, campus, limit } = body;

        if (dietTags.length === 0) {
            throw new ValidationError('请提供至少一个饮食标签（dietTags）');
        }

        const where: Record<string, unknown> = {
            deletedAt: null,
            isAvailable: true,
            tags: { hasSome: dietTags },
        };

        if (budget) {
            where.price = { lte: budget };
        }

        if (campus) {
            where.window = {
                is: { canteen: { is: { campus: { code: campus }, deletedAt: null } } },
            };
        }

        if (excludeIds.length > 0) {
            where.id = { notIn: excludeIds };
        }

        const dishes = await prisma.dish.findMany({
            where,
            include: {
                window: {
                    include: {
                        canteen: {
                            include: { campus: true },
                        },
                    },
                },
            },
            orderBy: { avgRating: 'desc' },
            take: limit,
        });

        const results: RecommendResult[] = dishes.map(dish => {
            const matchTags = findMatchingTags(dish.tags, dietTags);
            return {
                dish: dish as DishSummary,
                score: dish.avgRating,
                reason: generateReason(dish, dietTags),
                matchTags,
            };
        });

        return successResponse({
            results,
            aiResponse: buildSummary(results, dietTags),
            query: dietTags.join('、'),
            context: body,
        });
    },
});

function buildSummary(results: RecommendResult[], dietTags: string[]): string {
    if (results.length === 0) {
        return `暂时没有找到符合「${dietTags.join('、')}」标签的菜品，试试换一个标签？`;
    }

    const tagLabel = dietTags.slice(0, 3).join('、');
    return `根据你的「${tagLabel}」饮食偏好，为你推荐以下 ${results.length} 个菜品：`;
}
