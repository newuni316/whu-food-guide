/**
 * AI 模块 — 向后兼容入口
 *
 * 重新导出新的 AI 模块，保持现有代码的兼容性。
 * 新代码应直接从各子模块导入。
 */

export { getLLMClient, chatWithHistory, chatStreamWithHistory } from './ai/client';
export type { LLMMessage } from './ai/client';
export { generateEmbedding, generateEmbeddings, embedDish, batchEmbedAllDishes } from './ai/embedding';
export { semanticSearch, findSimilarDishes } from './ai/vector-search';
export { retrieveContext, parseUserIntent } from './ai/retriever';
export { getRecommendation } from './ai/recommender';
export { analyzeSentiment, extractKeywords, generateReviewSummary } from './ai/sentiment';
export { SYSTEM_PROMPT } from './ai/prompts';

/** @deprecated 使用 getLLMClient().chat() 代替 */
export async function chatWithAI(
    messages: { role: string; content: string }[],
    context?: Record<string, unknown>,
) {
    const { getLLMClient } = await import('./ai/client');
    const { SYSTEM_PROMPT } = await import('./ai/prompts');

    const client = getLLMClient();

    const contextStr = context
        ? Object.entries(context)
              .filter(([, v]) => v)
              .map(([k, v]) => `- ${k}: ${v}`)
              .join('\n')
        : '';

    const systemMessage = contextStr
        ? `${SYSTEM_PROMPT}\n\n当前上下文：\n${contextStr}`
        : SYSTEM_PROMPT;

    return client.chat([
        { role: 'system', content: systemMessage },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    ]);
}
