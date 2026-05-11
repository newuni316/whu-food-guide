/**
 * RAG 检索器
 *
 * 从用户查询中提取意图，检索相关菜品、食堂、评价，
 * 构建 LLM 上下文。是 RAG 管道的核心组件。
 */

import { prisma } from '@/lib/prisma';
import { semanticSearch } from './vector-search';
import { logger } from '@/lib/logger';
import type { RecommendRequest, DishSummary } from '@/types';
import type { Prisma } from '@prisma/client';

/** 检索结果 */
export interface RetrievalContext {
    dishes: DishSummary[];
    reviews: { content: string; rating: number; dishName: string }[];
    canteenInfo: { name: string; hours: Prisma.JsonValue; address: string; isOpen: boolean }[];
    query: string;
    filters: {
        budget?: number;
        diet?: string[];
        location?: string;
    };
}

/**
 * 解析用户意图
 *
 * 从自然语言查询中提取结构化过滤条件。
 */
export function parseUserIntent(query: string): {
    cleanQuery: string;
    budget?: number;
    diet?: string[];
    location?: string;
    time?: string;
} {
    let cleanQuery = query;
    const result: {
        cleanQuery: string;
        budget?: number;
        diet?: string[];
        location?: string;
        time?: string;
    } = { cleanQuery };

    // 提取预算
    const budgetMatch = query.match(/(\d+)\s*[块元以内下以下]/);
    if (budgetMatch) {
        result.budget = parseInt(budgetMatch[1], 10);
        cleanQuery = cleanQuery.replace(budgetMatch[0], '');
    }

    // 提取饮食偏好
    const dietKeywords = [
        { pattern: /减脂|低脂|低热量|清淡/, tag: '减脂' },
        { pattern: /增肌|高蛋白|蛋白质/, tag: '高蛋白' },
        { pattern: /素食|蔬菜|素/, tag: '素食' },
        { pattern: /辣|麻辣|重口/, tag: '辣' },
        { pattern: /早餐|早饭/, tag: '早餐' },
        { pattern: /夜宵|宵夜|深夜/, tag: '夜宵' },
        { pattern: /快餐|快/, tag: '快餐' },
        { pattern: /聚餐|聚会/, tag: '聚餐' },
        { pattern: /性价比|便宜|省钱/, tag: '性价比' },
    ];

    const diet: string[] = [];
    for (const { pattern, tag } of dietKeywords) {
        if (pattern.test(query)) {
            diet.push(tag);
        }
    }
    if (diet.length > 0) result.diet = diet;

    // 提取位置
    const locationKeywords = [
        '文理学部', '工学部', '信息学部', '医学部',
        '梅园', '桂园', '枫园', '樱园', '湖滨',
        '广八路', '街道口',
    ];
    for (const loc of locationKeywords) {
        if (query.includes(loc)) {
            result.location = loc;
            break;
        }
    }

    // 提取时间段
    const timeKeywords = [
        { pattern: /早餐|早上|早饭/, time: 'breakfast' },
        { pattern: /午餐|中午|午饭/, time: 'lunch' },
        { pattern: /晚餐|晚上|晚饭/, time: 'dinner' },
        { pattern: /夜宵|宵夜|深夜/, time: 'late_night' },
    ];
    for (const { pattern, time } of timeKeywords) {
        if (pattern.test(query)) {
            result.time = time;
            break;
        }
    }

    result.cleanQuery = cleanQuery.trim();
    return result;
}

/**
 * RAG 检索
 *
 * 根据用户查询检索相关信息，构建 LLM 上下文。
 */
export async function retrieveContext(request: RecommendRequest): Promise<RetrievalContext> {
    const { query, budget, diet, location } = request;
    const intent = parseUserIntent(query);

    const effectiveBudget = budget ?? intent.budget;
    const effectiveDiet = diet ?? intent.diet;
    const effectiveLocation = location ?? intent.location;

    logger.info('RAG retrieval started', 'retriever', {
        query,
        budget: effectiveBudget,
        diet: effectiveDiet,
        location: effectiveLocation,
    });

    // 1. 语义搜索菜品
    const vectorResults = await semanticSearch(
        intent.cleanQuery || query,
        15,
        {
            campus: effectiveLocation ? mapLocationToCampus(effectiveLocation) : undefined,
            priceMax: effectiveBudget,
        },
    );

    let dishes = vectorResults.map(r => r.dish);

    // 2. 标签过滤（diet 偏好）
    if (effectiveDiet && effectiveDiet.length > 0) {
        const tagFiltered = dishes.filter(d =>
            effectiveDiet.some(tag => d.tags.includes(tag))
        );
        // 如果标签过滤有结果，优先使用；否则保留原始结果
        if (tagFiltered.length > 0) {
            dishes = tagFiltered;
        }
    }

    // 3. 检索相关评价
    const dishIds = dishes.slice(0, 10).map(d => d.id);
    const reviews = await prisma.review.findMany({
        where: {
            dishId: { in: dishIds },
            deletedAt: null,
        },
        include: {
            dish: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    // 4. 检索食堂信息
    const canteenSlugs = [...new Set(
        dishes
            .map(d => d.window?.canteen?.slug)
            .filter(Boolean) as string[]
    )];

    const canteens = await prisma.canteen.findMany({
        where: { slug: { in: canteenSlugs }, deletedAt: null },
        select: { name: true, hours: true, address: true, isOpen: true },
    });

    return {
        dishes: dishes.slice(0, 10),
        reviews: reviews.map(r => ({
            content: r.content,
            rating: r.rating,
            dishName: r.dish.name,
        })),
        canteenInfo: canteens,
        query,
        filters: {
            budget: effectiveBudget,
            diet: effectiveDiet,
            location: effectiveLocation,
        },
    };
}

/**
 * 将位置名映射到校区 code
 */
function mapLocationToCampus(location: string): string | undefined {
    const mapping: Record<string, string> = {
        '文理学部': 'wenli',
        '工学部': 'gongxue',
        '信息学部': 'xinxixue',
        '医学部': 'yixue',
        '梅园': 'wenli',
        '桂园': 'wenli',
        '枫园': 'wenli',
        '樱园': 'wenli',
        '湖滨': 'wenli',
        '广八路': 'guangbalu',
        '街道口': 'jiedaokou',
        '银泰': 'yintai',
        '光谷': 'guanggu',
        '楚河汉街': 'chuhehanjie',
        '徐东': 'xudong',
        '虎泉': 'huquan',
        '亚贸': 'yamao',
        '群光': 'qunguang',
    };
    return mapping[location];
}

/**
 * 格式化检索结果为 LLM 上下文文本
 */
export function formatContextForLLM(context: RetrievalContext): string {
    const parts: string[] = [];

    // 用户需求
    parts.push(`## 用户需求`);
    parts.push(`查询：${context.query}`);
    if (context.filters.budget) parts.push(`预算：${context.filters.budget}元以内`);
    if (context.filters.diet) parts.push(`偏好：${context.filters.diet.join('、')}`);
    if (context.filters.location) parts.push(`位置：${context.filters.location}`);
    parts.push('');

    // 检索到的菜品
    if (context.dishes.length > 0) {
        parts.push(`## 可选菜品（按相关度排序）`);
        for (const dish of context.dishes.slice(0, 8)) {
            const canteenName = dish.window?.canteen?.name || '未知食堂';
            const windowName = dish.window?.name || '未知窗口';
            parts.push(
                `- ${dish.name} | ${canteenName} ${windowName} | ¥${dish.price} | ${dish.category} | 评分${dish.avgRating.toFixed(1)} | 标签：${dish.tags.join(',')}`
            );
        }
        parts.push('');
    }

    // 相关评价
    if (context.reviews.length > 0) {
        parts.push(`## 用户评价参考`);
        for (const review of context.reviews.slice(0, 5)) {
            parts.push(`- [${review.dishName}] ${review.content} (${review.rating}星)`);
        }
        parts.push('');
    }

    // 食堂信息
    if (context.canteenInfo.length > 0) {
        parts.push(`## 食堂信息`);
        for (const canteen of context.canteenInfo) {
            const status = canteen.isOpen ? '营业中' : '已关闭';
            parts.push(`- ${canteen.name} | ${status} | ${canteen.address}`);
        }
    }

    return parts.join('\n');
}
