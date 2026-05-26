import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const checkRateLimit = vi.fn();
const getClientIp = vi.fn();
const getLLMClient = vi.fn();
const retrieveContext = vi.fn();
const formatContextForLLM = vi.fn();
const aiChatCreate = vi.fn();

const chat = vi.fn();
const chatStream = vi.fn();

vi.mock('@/lib/auth', () => ({
    auth,
}));

vi.mock('@/lib/cache/rate-limit', () => ({
    checkRateLimit,
    getClientIp,
}));

vi.mock('@/lib/ai', () => ({
    getLLMClient,
    SYSTEM_PROMPT: 'SYSTEM_PROMPT',
}));

vi.mock('@/lib/ai/retriever', () => ({
    retrieveContext,
    formatContextForLLM,
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        aiChat: {
            create: aiChatCreate,
        },
    },
}));

async function loadRoute() {
    vi.resetModules();
    return import('@/app/api/ai/chat/route');
}

describe('POST /api/ai/chat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        auth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
        getClientIp.mockReturnValue('127.0.0.1');
        checkRateLimit.mockResolvedValue({
            allowed: true,
            remaining: 9,
            limit: 10,
            resetSeconds: 60,
        });
        retrieveContext.mockResolvedValue([]);
        formatContextForLLM.mockReturnValue('');
        aiChatCreate.mockResolvedValue({ id: 'chat-1' });
        chat.mockResolvedValue('推荐热干面');
        chatStream.mockReset();
        getLLMClient.mockReturnValue({ chat, chatStream });
    });

    it('persists assistant reply for non-streaming success responses', async () => {
        const { POST } = await loadRoute();
        const response = await POST(new Request('http://localhost/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: '推荐点吃的' }],
                context: { budget: 20 },
            }),
        }) as Request);

        expect(response.status).toBe(200);
        expect(chat).toHaveBeenCalled();
        expect(aiChatCreate).toHaveBeenCalledWith({
            data: {
                userId: 'user-1',
                title: '推荐点吃的',
                messages: [
                    { role: 'user', content: '推荐点吃的' },
                    { role: 'assistant', content: '推荐热干面' },
                ],
                context: { budget: 20 },
            },
        });

        const body = await response.json();
        expect(body.data.content).toBe('推荐热干面');
    });

    it('persists fallback reply when non-streaming AI call fails', async () => {
        chat.mockRejectedValue(new Error('upstream failed'));

        const { POST } = await loadRoute();
        const response = await POST(new Request('http://localhost/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: '晚上吃什么' }],
            }),
        }) as Request);

        expect(response.status).toBe(200);
        expect(aiChatCreate).toHaveBeenCalledWith({
            data: {
                userId: 'user-1',
                title: '晚上吃什么',
                messages: [
                    { role: 'user', content: '晚上吃什么' },
                    { role: 'assistant', content: '抱歉，AI 服务暂时不可用，请稍后再试。你也可以直接浏览食堂和菜品信息。' },
                ],
                context: null,
            },
        });
    });

    it('persists accumulated assistant reply for streaming responses', async () => {
        chatStream.mockImplementation(async function* () {
            yield '推荐';
            yield '热干面';
        });

        const { POST } = await loadRoute();
        const response = await POST(new Request('http://localhost/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: '来点推荐' }],
                stream: true,
            }),
        }) as Request);

        expect(response.headers.get('Content-Type')).toBe('text/event-stream');
        const text = await response.text();

        expect(text).toContain('data: {"content":"推荐"}');
        expect(text).toContain('data: {"content":"热干面"}');
        expect(text).toContain('data: [DONE]');
        expect(aiChatCreate).toHaveBeenCalledWith({
            data: {
                userId: 'user-1',
                title: '来点推荐',
                messages: [
                    { role: 'user', content: '来点推荐' },
                    { role: 'assistant', content: '推荐热干面' },
                ],
                context: null,
            },
        });
    });
});
