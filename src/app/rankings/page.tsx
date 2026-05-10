import { Suspense } from 'react';
import { TrendingUp, Flame, Moon, DollarSign, Dumbbell, Skull } from 'lucide-react';
import { RankingsContent } from './rankings-content';

export const metadata = {
    title: '热榜',
    description: '武汉大学美食实时热榜',
};

export default function RankingsPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">美食热榜</h1>
                <p className="mt-2 text-muted-foreground">
                    基于实时数据的美食排行，发现最受欢迎的美食
                </p>
            </div>
            <Suspense fallback={
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border overflow-hidden animate-pulse">
                            <div className="h-16 bg-muted" />
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="h-10 bg-muted rounded" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            }>
                <RankingsContent />
            </Suspense>
        </div>
    );
}
