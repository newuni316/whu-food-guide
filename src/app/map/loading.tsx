export default function MapLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-40 bg-muted rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[500px] bg-muted rounded-xl animate-pulse" />
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
