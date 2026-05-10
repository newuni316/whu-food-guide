'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { Trash2, RefreshCw, Filter } from 'lucide-react'

interface Review {
    id: string
    content: string
    rating: number
    sentiment: number | null
    keywords: string[]
    createdAt: string
    user: { id: string; name: string | null; email: string | null }
    dish: { id: string; name: string }
}

const SENTIMENT_OPTIONS = [
    { value: '', label: '全部' },
    { value: 'positive', label: '正面' },
    { value: 'negative', label: '负面' },
    { value: 'neutral', label: '中性' },
]

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [sentiment, setSentiment] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: '20' })
            if (sentiment) params.set('sentiment', sentiment)
            const res = await fetch(`/api/admin/reviews?${params}`)
            const json = await res.json()
            if (json.success) {
                setReviews(json.data)
                setTotalPages(json.pagination?.totalPages || 1)
            }
        } catch {
            toast({ type: 'error', title: '加载失败' })
        } finally {
            setLoading(false)
        }
    }, [page, sentiment])

    useEffect(() => { fetchData() }, [fetchData])

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该评论？此操作不可恢复。')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                toast({ type: 'success', title: '删除成功' })
                fetchData()
            } else {
                toast({ type: 'error', title: json.error?.message || '删除失败' })
            }
        } catch {
            toast({ type: 'error', title: '网络错误' })
        } finally {
            setDeleting(null)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">评论审核</h1>
                <div className="flex gap-2 items-center">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={sentiment}
                        onChange={e => { setSentiment(e.target.value); setPage(1) }}
                        className="h-9 rounded-lg border bg-background text-sm px-3"
                    >
                        {SENTIMENT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <Button variant="ghost" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无评论</div>
            ) : (
                <>
                    <div className="space-y-3">
                        {reviews.map(review => (
                            <div key={review.id} className="rounded-xl border bg-card p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="font-medium text-sm">{review.user.name || '匿名'}</span>
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(review.id)}
                                            disabled={deleting === review.id}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
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

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                上一页
                            </Button>
                            <span className="flex items-center text-sm text-muted-foreground px-2">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                下一页
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
