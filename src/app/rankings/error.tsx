'use client';

export default function RankingsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">排行榜加载失败</h2>
            <p className="text-muted-foreground mb-6">
                {error.message || '无法获取排行榜数据'}
            </p>
            <button
                onClick={reset}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg"
            >
                重试
            </button>
        </div>
    );
}
