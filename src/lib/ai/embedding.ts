/**
 * 文本向量化模块
 *
 * 使用 OpenAI text-embedding-3-small 生成 1536 维向量。
 * DeepSeek 目前不提供独立的 embedding API，所以统一用 OpenAI。
 * 如果没有 OpenAI key，使用降级方案（关键词匹配）。
 */

import { prisma } from '@/lib/prisma';
import { logger, createTimer } from '@/lib/logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

interface EmbeddingClient {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
}

/** OpenAI embedding 客户端 */
class OpenAIEmbeddingClient implements EmbeddingClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async embed(text: string): Promise<number[]> {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: text,
                dimensions: EMBEDDING_DIM,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Embedding API error: ${response.status} ${error}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: texts,
                dimensions: EMBEDDING_DIM,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Embedding API error: ${response.status} ${error}`);
        }

        const data = await response.json();
        return data.data
            .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
            .map((item: { embedding: number[] }) => item.embedding);
    }
}

let client: EmbeddingClient | null = null;

function getEmbeddingClient(): EmbeddingClient | null {
    if (client) return client;
    if (OPENAI_API_KEY) {
        client = new OpenAIEmbeddingClient(OPENAI_API_KEY);
        return client;
    }
    return null;
}

/**
 * 生成单个文本的向量嵌入
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    const embClient = getEmbeddingClient();
    if (!embClient) {
        logger.warn('Embedding client not available (no OPENAI_API_KEY)', 'embedding');
        return null;
    }

    const timer = createTimer('embedding');
    try {
        const embedding = await embClient.embed(text);
        timer.end({ textLength: text.length });
        return embedding;
    } catch (error) {
        logger.error('Embedding generation failed', 'embedding', {
            error: (error as Error).message,
        });
        return null;
    }
}

/**
 * 批量生成向量嵌入
 */
export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    const embClient = getEmbeddingClient();
    if (!embClient) {
        logger.warn('Embedding client not available', 'embedding');
        return texts.map(() => null);
    }

    const timer = createTimer('embedding-batch');
    try {
        // OpenAI API 限制每次最多 2048 条
        const batchSize = 100;
        const results: (number[] | null)[] = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const embeddings = await embClient.embedBatch(batch);
            results.push(...embeddings);

            // 避免速率限制
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        timer.end({ count: texts.length });
        return results;
    } catch (error) {
        logger.error('Batch embedding failed', 'embedding', {
            error: (error as Error).message,
        });
        return texts.map(() => null);
    }
}

/**
 * 生成菜品的 RAG 文本摘要（用于 embedding）
 */
export function buildDishEmbeddingText(dish: {
    name: string;
    description?: string | null;
    category: string;
    price: number;
    tags: string[];
    calories?: number | null;
    protein?: number | null;
    avgRating?: number;
    window?: { name: string; canteen?: { name: string } } | null;
}): string {
    const parts: string[] = [
        `菜品：${dish.name}`,
        `分类：${dish.category}`,
        `价格：${dish.price}元`,
    ];

    if (dish.description) {
        parts.push(`描述：${dish.description}`);
    }

    if (dish.window?.name) {
        parts.push(`窗口：${dish.window.name}`);
    }

    if (dish.window?.canteen?.name) {
        parts.push(`食堂：${dish.window.canteen.name}`);
    }

    if (dish.tags.length > 0) {
        parts.push(`标签：${dish.tags.join('、')}`);
    }

    if (dish.calories) {
        parts.push(`热量：${dish.calories}千卡`);
    }

    if (dish.protein) {
        parts.push(`蛋白质：${dish.protein}克`);
    }

    if (dish.avgRating && dish.avgRating > 0) {
        parts.push(`评分：${dish.avgRating.toFixed(1)}分`);
    }

    return parts.join('；');
}

/**
 * 为单个菜品生成并存储 embedding
 */
export async function embedDish(dishId: string): Promise<boolean> {
    const dish = await prisma.dish.findUnique({
        where: { id: dishId },
        include: {
            window: { include: { canteen: true } },
        },
    });

    if (!dish) return false;

    const text = buildDishEmbeddingText(dish);
    const embedding = await generateEmbedding(text);

    if (!embedding) return false;

    await prisma.dishEmbedding.upsert({
        where: { dishId: dish.id },
        create: {
            dishId: dish.id,
            embedding: `[${embedding.join(',')}]`,
            content: text,
        },
        update: {
            embedding: `[${embedding.join(',')}]`,
            content: text,
        },
    });

    logger.info(`Embedded dish: ${dish.name}`, 'embedding');
    return true;
}

/**
 * 批量为所有菜品生成 embeddings（种子数据时调用）
 */
export async function batchEmbedAllDishes(): Promise<number> {
    const dishes = await prisma.dish.findMany({
        where: { deletedAt: null },
        include: {
            window: { include: { canteen: true } },
        },
    });

    if (dishes.length === 0) return 0;

    const texts = dishes.map(buildDishEmbeddingText);
    const embeddings = await generateEmbeddings(texts);

    let successCount = 0;

    for (let i = 0; i < dishes.length; i++) {
        if (!embeddings[i]) continue;

        try {
            await prisma.dishEmbedding.upsert({
                where: { dishId: dishes[i].id },
                create: {
                    dishId: dishes[i].id,
                    embedding: `[${embeddings[i]!.join(',')}]`,
                    content: texts[i],
                },
                update: {
                    embedding: `[${embeddings[i]!.join(',')}]`,
                    content: texts[i],
                },
            });
            successCount++;
        } catch (error) {
            logger.error(`Failed to embed dish ${dishes[i].name}`, 'embedding', {
                error: (error as Error).message,
            });
        }
    }

    logger.info(`Batch embedding complete: ${successCount}/${dishes.length}`, 'embedding');
    return successCount;
}
