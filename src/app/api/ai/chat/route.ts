import { createMethodHandler, withAuth, successResponse } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/errors';
import { getLLMClient, SYSTEM_PROMPT } from '@/lib/ai';
import { retrieveContext, formatContextForLLM } from '@/lib/ai/retriever';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/cache/rate-limit';

export const dynamic = 'force-dynamic';

export const POST = createMethodHandler({
    POST: withAuth(async (request) => {
        // 限流：每 IP 每分钟 10 次
        const ip = getClientIp(request);
        const rateLimit = await checkRateLimit(`ai:chat:${ip}`, 10, 60);
        if (!rateLimit.allowed) {
            return Response.json(
                { success: false, error: '请求过于频繁，请稍后再试' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.resetSeconds),
                        'X-RateLimit-Limit': String(rateLimit.limit),
                        'X-RateLimit-Remaining': '0',
                    },
                },
            );
        }

        const { messages, context } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            throw new ValidationError('消息格式不正确');
        }

        const client = getLLMClient();

        // RAG 检索上下文
        let ragContext = '';
        const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
        if (lastUserMessage) {
            try {
                const retrieval = await retrieveContext({
                    query: lastUserMessage.content,
                    budget: context?.budget,
                    diet: context?.diet,
                    location: context?.location,
                });
                ragContext = formatContextForLLM(retrieval);
            } catch {
                // RAG 失败不影响对话
            }
        }

        const systemMessage = ragContext
            ? `${SYSTEM_PROMPT}\n\n以下是检索到的相关信息，请基于这些信息回答：\n\n${ragContext}`
            : SYSTEM_PROMPT;

        let content: string;
        try {
            content = await client.chat(
                messages.map((m: { role: string; content: string }) => ({
                    role: m.role as 'system' | 'user' | 'assistant',
                    content: m.content,
                })),
                { temperature: 0.7, maxTokens: 1024 },
            );
        } catch {
            content = '抱歉，AI 服务暂时不可用，请稍后再试。你也可以直接浏览食堂和菜品信息。';
        }

        // 保存对话记录
        const session = (request as Request & { session?: { user?: { id?: string } } }).session;
        if (session?.user?.id) {
            await prisma.aiChat.create({
                data: {
                    userId: session.user.id,
                    title: messages[0]?.content?.slice(0, 50) || '新对话',
                    messages,
                    context: context || null,
                },
            });
        }

        return successResponse({ content });
    }),
});
