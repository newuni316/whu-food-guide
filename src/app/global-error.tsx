'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html lang="zh-CN">
            <body>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                        出了点问题
                    </h1>
                    <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
                        {error.message || '页面遇到了意外错误，请刷新重试'}
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}
                    >
                        重新加载
                    </button>
                </div>
            </body>
        </html>
    );
}
