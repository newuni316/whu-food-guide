import { withAuth, type AuthenticatedRequest } from '@/lib/api/middleware';
import { ValidationError, handleApiError } from '@/lib/errors';
import { getLLMClient, SYSTEM_PROMPT } from '@/lib/ai';
import { retrieveContext, formatContextForLLM } from '@/lib/ai/retriever';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/cache/rate-limit';

export const dynamic = 'force-dynamic';

type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

function getChatTitle(messages: { content?: string }[]) {
    return messages[0]?.content?.slice(0, 50) || '新对话';
}

async function saveAiChat(
    userId: string | undefined,
    messages: ChatMessage[],
    assistantContent: string,
    context: unknown,
) {
    if (!userId) return;

    await prisma.aiChat.create({
        data: {
            userId,
            title: getChatTitle(messages),
            messages: [...messages, { role: 'assistant', content: assistantContent }],
            context: context || null,
        },
    });
}

const POST = withAuth(async (request: AuthenticatedRequest) => {
    // 限流
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

    const { messages, context, stream: wantStream } = await request.json();

    if (!messages || !Array.isArray(messages)) {
        throw new ValidationError('消息格式不正确');
    }

    const chatMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
    })) as ChatMessage[];

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

    const llmMessages = [
        { role: 'system' as const, content: systemMessage },
        ...chatMessages,
    ];

    const userId = request.session.user.id;

    // 流式响应
    if (wantStream) {
        const encoder = new TextEncoder();
        let fullContent = '';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of client.chatStream(llmMessages, { temperature: 0.7, maxTokens: 1024 })) {
                        fullContent += chunk;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                } catch {
                    if (!fullContent) {
                        const fallback = '抱歉，AI 服务暂时不可用。';
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: fallback })}\n\n`));
                        fullContent = fallback;
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                } finally {
                    controller.close();
                    saveAiChat(userId, chatMessages, fullContent, context).catch(() => {});
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    }

    // 非流式响应（兼容旧客户端）
    let content: string;
    try {
        content = await client.chat(llmMessages, { temperature: 0.7, maxTokens: 1024 });
    } catch {
        content = '抱歉，AI 服务暂时不可用，请稍后再试。你也可以直接浏览食堂和菜品信息。';
    }

    await saveAiChat(userId, chatMessages, content, context);

    return Response.json({ success: true, data: { content } });
});

export { POST };
