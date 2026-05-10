import { Suspense } from 'react';
import ExploreContent from './explore-content';

export const metadata = {
    title: '探索美食',
    description: '探索武汉大学所有食堂和美食，支持语义搜索',
};

export default function ExplorePage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="h-12 bg-muted rounded-xl animate-pulse mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border p-4 space-y-3 animate-pulse">
                            <div className="h-5 bg-muted rounded w-2/3" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        }>
            <ExploreContent />
        </Suspense>
    );
}
