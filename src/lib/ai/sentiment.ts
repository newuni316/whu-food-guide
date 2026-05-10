/**
 * 情感分析模块
 *
 * 分析评论的情感倾向，提取关键词，生成摘要。
 * 支持 LLM 分析和规则降级两种方案。
 */

import { getLLMClient } from './client';
import { SENTIMENT_PROMPT, REVIEW_SUMMARY_PROMPT } from './prompts';
import { logger } from '@/lib/logger';

export interface SentimentResult {
    sentiment: number;   // -1.0 到 1.0
    keywords: string[];
    summary: string;
}

/**
 * 分析单条评论的情感
 *
 * 优先使用 LLM，不可用时使用关键词规则。
 */
export async function analyzeSentiment(content: string): Promise<SentimentResult> {
    // 尝试 LLM 分析
    try {
        const client = getLLMClient();
        const prompt = SENTIMENT_PROMPT.replace('{content}', content);

        const response = await client.chat([
            { role: 'system', content: '你是情感分析专家，只输出JSON。' },
            { role: 'user', content: prompt },
        ], { temperature: 0.1, maxTokens: 200 });

        // 解析 JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                sentiment: Math.max(-1, Math.min(1, parsed.sentiment || 0)),
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
                summary: parsed.summary || '',
            };
        }
    } catch (error) {
        logger.warn('LLM sentiment analysis failed, using fallback', 'sentiment', {
            error: (error as Error).message,
        });
    }

    // 降级：关键词规则分析
    return ruleBasedSentiment(content);
}

/**
 * 基于规则的情感分析（降级方案）
 */
function ruleBasedSentiment(content: string): SentimentResult {
    const positiveWords = [
        '好吃', '推荐', '不错', '很棒', '美味', '鲜', '香', '嫩',
        '划算', '实惠', '量大', '性价比', '赞', '喜欢', '满意',
        '干净', '服务好', '速度快', '新鲜', '入味', '地道',
    ];

    const negativeWords = [
        '难吃', '差', '失望', '贵', '少', '慢', '不新鲜',
        '不干净', '排队', '咸', '油腻', '踩雷', '一般', '普通',
        '不行', '太差', '不好', '贵了', '分量少', '态度差',
    ];

    const keywords: string[] = [];
    let score = 0;

    for (const word of positiveWords) {
        if (content.includes(word)) {
            score += 0.2;
            keywords.push(word);
        }
    }

    for (const word of negativeWords) {
        if (content.includes(word)) {
            score -= 0.2;
            keywords.push(word);
        }
    }

    return {
        sentiment: Math.max(-1, Math.min(1, score)),
        keywords: [...new Set(keywords)].slice(0, 5),
        summary: '',
    };
}

/**
 * 提取评论关键词
 */
export async function extractKeywords(content: string): Promise<string[]> {
    const result = await analyzeSentiment(content);
    return result.keywords;
}

/**
 * 批量分析评论情感
 */
export async function batchAnalyzeSentiment(
    reviews: { id: string; content: string }[],
): Promise<Map<string, SentimentResult>> {
    const results = new Map<string, SentimentResult>();

    // 并发分析，但限制并发数
    const concurrency = 3;
    for (let i = 0; i < reviews.length; i += concurrency) {
        const batch = reviews.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(async (review) => {
                const result = await analyzeSentiment(review.content);
                return { id: review.id, result };
            })
        );

        for (const { id, result } of batchResults) {
            results.set(id, result);
        }
    }

    return results;
}

/**
 * 生成评论摘要
 *
 * 将多条评论汇总为一段简洁的口碑摘要。
 */
export async function generateReviewSummary(
    targetName: string,
    reviews: { content: string; rating: number }[],
): Promise<string> {
    if (reviews.length === 0) return '暂无评价';

    try {
        const client = getLLMClient();
        const reviewsText = reviews
            .slice(0, 20)
            .map(r => `- ${r.content} (${r.rating}星)`)
            .join('\n');

        const prompt = REVIEW_SUMMARY_PROMPT
            .replace('{target_name}', targetName)
            .replace('{reviews}', reviewsText);

        return await client.chat([
            { role: 'system', content: '你是评价分析专家，生成简洁的口碑摘要。' },
            { role: 'user', content: prompt },
        ], { temperature: 0.3, maxTokens: 200 });
    } catch (error) {
        logger.warn('Review summary generation failed', 'sentiment', {
            error: (error as Error).message,
        });

        // 降级：计算平均分
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        return `共${reviews.length}条评价，平均${avgRating.toFixed(1)}星`;
    }
}
