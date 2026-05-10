'use client';

import { useEffect } from 'react';

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-semibold mb-2">页面出错了</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
                {error.message || '遇到了意外错误，请尝试刷新页面'}
            </p>
            <button
                onClick={reset}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
                重新加载
            </button>
        </div>
    );
}
