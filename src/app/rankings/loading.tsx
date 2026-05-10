export default function RankingsLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-32 bg-muted rounded animate-pulse mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border overflow-hidden">
                        <div className="h-16 bg-muted animate-pulse" />
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                                    <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                                    <div className="w-10 h-4 bg-muted rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
