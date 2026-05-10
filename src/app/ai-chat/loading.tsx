export default function AIChatLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="h-8 w-40 bg-muted rounded animate-pulse mb-8" />
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-2xl p-4 max-w-[70%] animate-pulse ${
                            i % 2 === 0 ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                            <div className="h-4 w-32 bg-current/10 rounded" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 h-12 bg-muted rounded-xl animate-pulse" />
        </div>
    );
}
