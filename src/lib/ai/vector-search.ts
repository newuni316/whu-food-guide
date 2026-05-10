/**
 * 向量搜索模块
 *
 * 使用 pgvector 进行语义相似度搜索。
 * 支持菜品语义搜索和相似菜品推荐。
 */

import { prisma } from '@/lib/prisma';
import { generateEmbedding } from './embedding';
import { logger, createTimer } from '@/lib/logger';
import type { DishSummary, SearchResult } from '@/types';

/** 向量搜索结果 */
export interface VectorSearchResult {
    dishId: string;
    similarity: number;
}

/**
 * 语义搜索菜品
 *
 * 将用户查询转为向量，与数据库中的菜品向量做余弦相似度比较。
 * 返回最相关的 topK 个菜品。
 */
export async function semanticSearch(
    query: string,
    topK = 10,
    filters?: {
        campus?: string;
        priceMax?: number;
        tags?: string[];
    },
): Promise<(VectorSearchResult & { dish: DishSummary })[]> {
    const timer = createTimer('semantic-search');

    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
        logger.warn('Embedding not available, falling back to text search', 'vector-search');
        return fallbackTextSearch(query, topK, filters);
    }

    const vectorStr = `[${queryEmbedding.join(',')}]`;

    try {
        // pgvector 余弦距离查询
        // 1 - cosine_distance = cosine_similarity
        // 距离越小越相似
        const results = await prisma.$queryRaw<
            { dish_id: string; similarity: number }[]
        >`
            SELECT
                de."dishId" as dish_id,
                1 - (de.embedding <=> ${vectorStr}::vector) as similarity
            FROM "DishEmbedding" de
            JOIN "Dish" d ON d.id = de."dishId"
            JOIN "Window" w ON w.id = d."windowId"
            JOIN "Canteen" c ON c.id = w."canteenId"
            JOIN "Campus" cp ON cp.id = c."campusId"
            WHERE d."deletedAt" IS NULL
              AND d."isAvailable" = true
              ${filters?.campus
                ? prisma.$queryRaw`AND cp.code = ${filters.campus}`
                : prisma.$queryRaw``
              }
              ${filters?.priceMax
                ? prisma.$queryRaw`AND d.price <= ${filters.priceMax}`
                : prisma.$queryRaw``
              }
            ORDER BY de.embedding <=> ${vectorStr}::vector
            LIMIT ${topK}
        `;

        timer.end({ resultCount: results.length });

        // 批量查询菜品详情
        const dishIds = results.map(r => r.dish_id);
        const dishes = await prisma.dish.findMany({
            where: { id: { in: dishIds } },
            include: {
                window: { include: { canteen: true } },
            },
        });

        // 按相似度排序
        const dishMap = new Map(dishes.map(d => [d.id, d]));
        return results
            .map(r => ({
                dishId: r.dish_id,
                similarity: r.similarity,
                dish: dishMap.get(r.dish_id) as DishSummary,
            }))
            .filter(r => r.dish); // 过滤掉未找到的
    } catch (error) {
        logger.error('Vector search failed', 'vector-search', {
            error: (error as Error).message,
        });
        return fallbackTextSearch(query, topK, filters);
    }
}

/**
 * 降级文本搜索 — 当向量搜索不可用时
 */
async function fallbackTextSearch(
    query: string,
    topK: number,
    filters?: {
        campus?: string;
        priceMax?: number;
        tags?: string[];
    },
): Promise<(VectorSearchResult & { dish: DishSummary })[]> {
    const where: Record<string, unknown> = {
        deletedAt: null,
        isAvailable: true,
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
            { category: { contains: query, mode: 'insensitive' } },
        ],
    };

    if (filters?.priceMax) {
        where.price = { lte: filters.priceMax };
    }

    if (filters?.campus) {
        where.window = {
            canteen: { campus: { code: filters.campus } },
        };
    }

    const dishes = await prisma.dish.findMany({
        where,
        include: {
            window: { include: { canteen: true } },
        },
        take: topK,
        orderBy: { avgRating: 'desc' },
    });

    return dishes.map(dish => ({
        dishId: dish.id,
        similarity: 0.5, // 降级搜索给固定相似度
        dish: dish as DishSummary,
    }));
}

/**
 * 查找相似菜品
 *
 * 给定一个菜品 ID，找到最相似的其他菜品。
 */
export async function findSimilarDishes(
    dishId: string,
    topK = 5,
): Promise<(VectorSearchResult & { dish: DishSummary })[]> {
    const timer = createTimer('similar-dishes');

    try {
        const results = await prisma.$queryRaw<
            { dish_id: string; similarity: number }[]
        >`
            SELECT
                de2."dishId" as dish_id,
                1 - (de1.embedding <=> de2.embedding) as similarity
            FROM "DishEmbedding" de1
            CROSS JOIN "DishEmbedding" de2
            JOIN "Dish" d ON d.id = de2."dishId"
            WHERE de1."dishId" = ${dishId}
              AND de2."dishId" != ${dishId}
              AND d."deletedAt" IS NULL
              AND d."isAvailable" = true
            ORDER BY de1.embedding <=> de2.embedding
            LIMIT ${topK}
        `;

        timer.end({ dishId, resultCount: results.length });

        const dishIds = results.map(r => r.dish_id);
        const dishes = await prisma.dish.findMany({
            where: { id: { in: dishIds } },
            include: {
                window: { include: { canteen: true } },
            },
        });

        const dishMap = new Map(dishes.map(d => [d.id, d]));
        return results
            .map(r => ({
                dishId: r.dish_id,
                similarity: r.similarity,
                dish: dishMap.get(r.dish_id) as DishSummary,
            }))
            .filter(r => r.dish);
    } catch (error) {
        logger.error('Similar dishes search failed', 'vector-search', {
            error: (error as Error).message,
            dishId,
        });
        return [];
    }
}

/**
 * 将向量搜索结果转换为通用搜索结果格式
 */
export function toSearchResults(
    vectorResults: (VectorSearchResult & { dish: DishSummary })[],
): SearchResult[] {
    return vectorResults.map(r => ({
        type: 'dish' as const,
        id: r.dish.id,
        name: r.dish.name,
        description: r.dish.description ?? undefined,
        price: r.dish.price,
        rating: r.dish.avgRating,
        tags: r.dish.tags,
        canteenName: r.dish.window?.canteen?.name,
        campusName: undefined,
        score: r.similarity,
    }));
}
