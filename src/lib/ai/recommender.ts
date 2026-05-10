/**
 * 推荐引擎
 *
 * 核心推荐逻辑：检索 → 过滤 → 排序 → 生成理由。
 * 结合 RAG 检索 + 用户画像 + LLM 生成推荐。
 */

import { retrieveContext, formatContextForLLM } from './retriever';
import { RECOMMEND_FORMAT_PROMPT } from './prompts';
import { getLLMClient } from './client';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache/redis';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import { logger, createTimer } from '@/lib/logger';
import type {
    RecommendRequest,
    RecommendResult,
    RecommendResponse,
    DishSummary,
} from '@/types';
import { createHash } from 'crypto';

/**
 * 生成推荐
 *
 * 完整的推荐流程：
 * 1. RAG 检索相关菜品
 * 2. 结合用户画像过滤
 * 3. 计算综合得分
 * 4. LLM 生成推荐理由
 */
export async function getRecommendation(
    request: RecommendRequest,
    userId?: string,
): Promise<RecommendResponse> {
    const timer = createTimer('recommendation');

    // 缓存键（不包含 userId，相同查询共享缓存）
    const queryHash = createHash('md5')
        .update(JSON.stringify(request))
        .digest('hex')
        .slice(0, 12);

    // 核心推荐逻辑封装到 withCache fetcher 中
    const response = await withCache(
        CacheKeys.recommend.query(queryHash),
        CacheTTL.RECOMMEND,
        async () => {
            // 1. RAG 检索
            const context = await retrieveContext(request);

            // 2. 用户画像加权（仅用于排序，不进入缓存键）
            let userDietTags: string[] = [];
            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { dietTags: true },
                });
                userDietTags = user?.dietTags || [];
            }

            // 3. 综合排序
            const rankedDishes = rankDishes(context.dishes, {
                budget: request.budget ?? context.filters.budget,
                diet: request.diet ?? context.filters.diet,
                userDietTags,
            });

            // 4. 构建推荐结果
            const results: RecommendResult[] = rankedDishes.slice(0, 5).map(dish => ({
                dish: dish as DishSummary,
                score: dish._score,
                reason: generateQuickReason(dish, request),
                matchTags: findMatchingTags(dish, request),
            }));

            // 5. LLM 生成推荐总结
            let aiResponse = '';
            try {
                const llm = getLLMClient();
                const contextText = formatContextForLLM(context);
                const prompt = RECOMMEND_FORMAT_PROMPT
                    .replace('{query}', request.query)
                    .replace('{preferences}', [
                        request.budget ? `预算${request.budget}元` : '',
                        request.diet?.join('、') || '',
                        request.location || '',
                    ].filter(Boolean).join('，') || '无特殊偏好')
                    .replace('{retrieved_dishes}', contextText);

                aiResponse = await llm.chat([
                    { role: 'system', content: '你是武大美食推荐助手，请根据检索到的信息生成推荐回复。' },
                    { role: 'user', content: prompt },
                ]);
            } catch (error) {
                logger.error('LLM recommendation generation failed', 'recommender', {
                    error: (error as Error).message,
                });
                aiResponse = generateFallbackResponse(results, request);
            }

            return {
                results,
                aiResponse,
                query: request.query,
                context: request,
            };
        },
    );

    // 记录推荐日志（缓存之外，避免影响缓存内容）
    if (userId) {
        await prisma.recommendationLog.create({
            data: {
                userId,
                query: request.query,
                context: {
                    budget: request.budget,
                    diet: request.diet,
                    location: request.location,
                },
                results: response.results.map(r => ({
                    dishId: r.dish.id,
                    dishName: r.dish.name,
                    score: r.score,
                })),
            },
        });
    }

    timer.end({ resultCount: response.results.length });
    return response;
}

/** 带得分的菜品 */
interface ScoredDish extends DishSummary {
    _score: number;
}

/**
 * 综合排序算法
 *
 * 多维度加权评分：
 * - 语义相关度 (40%)
 * - 评分 (25%)
 * - 预算匹配 (20%)
 * - 标签匹配 (15%)
 */
function rankDishes(
    dishes: DishSummary[],
    filters: {
        budget?: number;
        diet?: string[];
        userDietTags?: string[];
    },
): ScoredDish[] {
    return dishes
        .map((dish, index) => {
            let score = 0;

            // 语义相关度（使用 index 参数避免 indexOf 引用比较问题）
            score += 0.4 * (1 - index / Math.max(dishes.length, 1));

            // 评分
            score += 0.25 * (dish.avgRating / 5);

            // 预算匹配
            if (filters.budget) {
                if (dish.price <= filters.budget) {
                    // 越接近预算上限性价比越高
                    score += 0.2 * (dish.price / filters.budget);
                } else {
                    score -= 0.2; // 超预算扣分
                }
            } else {
                score += 0.1; // 无预算约束给中间分
            }

            // 标签匹配
            const allDietTags = [...(filters.diet || []), ...(filters.userDietTags || [])];
            if (allDietTags.length > 0) {
                const matchCount = allDietTags.filter(tag => dish.tags.includes(tag)).length;
                score += 0.15 * (matchCount / allDietTags.length);
            } else {
                score += 0.075;
            }

            return { ...dish, _score: Math.round(score * 100) / 100 };
        })
        .sort((a, b) => b._score - a._score);
}

/**
 * 快速生成推荐理由（不调用 LLM）
 */
function generateQuickReason(dish: DishSummary, request: RecommendRequest): string {
    const reasons: string[] = [];

    if (request.budget && dish.price <= request.budget) {
        reasons.push(`价格${dish.price}元在预算内`);
    }

    if (dish.avgRating >= 4.5) {
        reasons.push('口碑很好');
    }

    const dietMatch = (request.diet || []).filter(tag => dish.tags.includes(tag));
    if (dietMatch.length > 0) {
        reasons.push(`符合${dietMatch.join('、')}需求`);
    }

    if (dish.tags.includes('推荐')) {
        reasons.push('热门推荐');
    }

    return reasons.join('，') || '值得一试';
}

/**
 * 查找匹配的标签
 */
function findMatchingTags(dish: DishSummary, request: RecommendRequest): string[] {
    const tags: string[] = [];
    const allTags = [
        ...(request.diet || []),
        ...(request.tags || []),
    ];
    for (const tag of allTags) {
        if (dish.tags.includes(tag)) {
            tags.push(tag);
        }
    }
    return tags;
}

/**
 * 降级推荐响应（LLM 不可用时）
 */
function generateFallbackResponse(results: RecommendResult[], request: RecommendRequest): string {
    if (results.length === 0) {
        return `抱歉，没有找到符合"${request.query}"的菜品，试试换个关键词？`;
    }

    const lines = [`根据你的需求"${request.query}"，为你推荐以下菜品：\n`];

    for (const r of results.slice(0, 3)) {
        const canteenName = r.dish.window?.canteen?.name || '';
        lines.push(`🍽️ ${r.dish.name}（${canteenName}）— ¥${r.dish.price}，${r.reason}`);
    }

    lines.push('\n更多推荐请查看完整列表 👇');
    return lines.join('\n');
}
