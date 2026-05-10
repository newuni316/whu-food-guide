import { createMethodHandler, withAuth, successResponse } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/errors';
import { getLLMClient, SYSTEM_PROMPT } from '@/lib/ai';
import { retrieveContext, formatContextForLLM } from '@/lib/ai/retriever';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = createMethodHandler({
    POST: withAuth(async (request) => {
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

        const content = await client.chat(
            messages.map((m: { role: string; content: string }) => ({
                role: m.role as 'system' | 'user' | 'assistant',
                content: m.content,
            })),
            { temperature: 0.7, maxTokens: 1024 },
        );

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
