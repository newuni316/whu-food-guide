/**
 * LLM 客户端
 *
 * 统一的 LLM 调用封装，支持 DeepSeek 和 OpenAI。
 * 通过环境变量 AI_PROVIDER 切换。
 */

import { logger, createTimer } from '@/lib/logger';

export type LLMMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

interface LLMClient {
    chat(messages: LLMMessage[], options?: ChatOptions): Promise<string>;
    chatStream(messages: LLMMessage[], options?: ChatOptions): AsyncGenerator<string>;
}

interface ChatOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
}

const AI_PROVIDER = process.env.AI_PROVIDER || 'deepseek';
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/** DeepSeek / OpenAI 兼容客户端 */
class OpenAICompatibleClient implements LLMClient {
    private apiKey: string;
    private baseUrl: string;
    private defaultModel: string;

    constructor(apiKey: string, baseUrl: string, defaultModel: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.defaultModel = defaultModel;
    }

    async chat(messages: LLMMessage[], options?: ChatOptions): Promise<string> {
        const timer = createTimer('llm-chat');
        const model = options?.model || this.defaultModel;

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1024,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            timer.end({ error: true });
            throw new Error(`LLM API error: ${response.status} ${error}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        timer.end({ model, tokens: data.usage?.total_tokens });
        return content;
    }

    async *chatStream(messages: LLMMessage[], options?: ChatOptions): AsyncGenerator<string> {
        const model = options?.model || this.defaultModel;

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1024,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`LLM Stream API error: ${response.status} ${error}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const data = trimmed.slice(6);
                if (data === '[DONE]') return;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content;
                    if (content) yield content;
                } catch {
                    // 跳过解析错误
                }
            }
        }
    }
}

let llmClient: LLMClient | null = null;

/**
 * 获取 LLM 客户端实例
 */
export function getLLMClient(): LLMClient {
    if (llmClient) return llmClient;

    if (AI_PROVIDER === 'deepseek' && DEEPSEEK_API_KEY) {
        llmClient = new OpenAICompatibleClient(
            DEEPSEEK_API_KEY,
            'https://api.deepseek.com/v1',
            AI_MODEL || 'deepseek-chat',
        );
        logger.info('Using DeepSeek as LLM provider', 'ai-client');
    } else if (OPENAI_API_KEY) {
        llmClient = new OpenAICompatibleClient(
            OPENAI_API_KEY,
            'https://api.openai.com/v1',
            AI_MODEL || 'gpt-4o-mini',
        );
        logger.info('Using OpenAI as LLM provider', 'ai-client');
    } else {
        // 返回一个 mock client，返回错误信息
        logger.warn('No AI API key configured, using mock client', 'ai-client');
        llmClient = {
            async chat() {
                return 'AI 服务未配置。请在 .env.local 中设置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY。';
            },
            async *chatStream() {
                yield 'AI 服务未配置。';
            },
        };
    }

    return llmClient;
}

/**
 * 带历史对话的聊天
 */
export async function chatWithHistory(
    messages: LLMMessage[],
    systemPrompt?: string,
): Promise<string> {
    const client = getLLMClient();

    const fullMessages: LLMMessage[] = [];
    if (systemPrompt) {
        fullMessages.push({ role: 'system', content: systemPrompt });
    }
    fullMessages.push(...messages);

    return client.chat(fullMessages);
}

/**
 * 流式聊天
 */
export async function* chatStreamWithHistory(
    messages: LLMMessage[],
    systemPrompt?: string,
): AsyncGenerator<string> {
    const client = getLLMClient();

    const fullMessages: LLMMessage[] = [];
    if (systemPrompt) {
        fullMessages.push({ role: 'system', content: systemPrompt });
    }
    fullMessages.push(...messages);

    yield* client.chatStream(fullMessages);
}
