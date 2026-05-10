export default function ExploreLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* 搜索栏骨架 */}
            <div className="h-12 bg-muted rounded-xl animate-pulse mb-6" />

            {/* 筛选栏骨架 */}
            <div className="flex gap-2 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-9 w-20 bg-muted rounded-full animate-pulse" />
                ))}
            </div>

            {/* 卡片网格骨架 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-3">
                        <div className="h-40 bg-muted rounded-lg animate-pulse" />
                        <div className="h-5 bg-muted rounded w-2/3 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                            <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
