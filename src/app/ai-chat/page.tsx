'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const QUICK_PROMPTS = [
    '20块以内有什么好吃的？',
    '推荐减脂餐',
    '信息学部附近有什么？',
    '高蛋白低脂的菜品',
    '晚上有什么夜宵？',
    '性价比高的食堂',
];

export default function AiChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSubmit(text?: string) {
        const query = text || input.trim();
        if (!query || loading) return;

        const userMessage: Message = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });
            const data = await res.json();
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: data.data?.content || data.content || '暂时无法回答' },
            ]);
        } catch (err) {
            console.error('AI chat error:', err);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '抱歉，AI 服务暂时不可用，请稍后再试。' },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col h-[calc(100vh-8rem)] px-4 py-6 sm:px-6">
            {/* 头部 */}
            <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-3">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI 食堂助手
                </div>
                <h1 className="text-2xl font-bold tracking-tight">今天吃什么？</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    让 AI 帮你推荐最合适的食堂、窗口和菜品
                </p>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bot className="mb-4 h-12 w-12 text-primary/30" />
                        <h2 className="text-lg font-semibold mb-2">开始对话</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            试试下面的快捷问题，或自由输入你的需求
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 max-w-md">
                            {QUICK_PROMPTS.map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSubmit(prompt)}
                                    className="px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-muted/80 transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                            }`}
                        >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                        {msg.role === 'user' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                                <User className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="rounded-2xl bg-secondary px-4 py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* 快捷标签（对话中） */}
            {messages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 px-1">
                    {QUICK_PROMPTS.slice(0, 4).map(prompt => (
                        <button
                            key={prompt}
                            onClick={() => handleSubmit(prompt)}
                            disabled={loading}
                            className="px-2.5 py-1 rounded-full text-xs bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* 输入框 */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                className="relative"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入你的问题，如「20元以内减脂餐」..."
                    disabled={loading}
                    className="w-full rounded-2xl border bg-card py-3.5 pl-5 pr-14 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary p-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </button>
            </form>
        </div>
    );
}
