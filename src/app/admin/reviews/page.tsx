import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
    const reviews = await prisma.review.findMany({
        where: { deletedAt: null },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, name: true, email: true } },
            dish: { select: { id: true, name: true } },
        },
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">评论审核</h1>

            <div className="space-y-3">
                {reviews.map(review => (
                    <div key={review.id} className="rounded-xl border bg-card p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="font-medium text-sm">{review.user.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">{review.user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {review.sentiment !== null && (
                                    <Badge variant={
                                        review.sentiment > 0.3 ? 'default' :
                                        review.sentiment < -0.3 ? 'destructive' : 'secondary'
                                    }>
                                        {review.sentiment > 0.3 ? '正面' :
                                         review.sentiment < -0.3 ? '负面' : '中性'}
                                    </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    {review.rating}星
                                </span>
                            </div>
                        </div>

                        <p className="text-sm mb-2">{review.content}</p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>菜品：{review.dish.name}</span>
                            <span>·</span>
                            <span>{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                            {review.keywords.length > 0 && (
                                <>
                                    <span>·</span>
                                    {review.keywords.map(kw => (
                                        <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
