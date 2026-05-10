'use client';

export default function AIChatError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold mb-2">AI 助手出错了</h2>
            <p className="text-muted-foreground mb-6">
                {error.message || 'AI 服务暂时不可用'}
            </p>
            <button
                onClick={reset}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg"
            >
                重新开始
            </button>
        </div>
    );
}
