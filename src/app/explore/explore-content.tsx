'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SearchResult } from '@/types';

const CAMPUS_OPTIONS = [
    { code: '', label: '全部校区' },
    { code: 'wenli', label: '文理学部' },
    { code: 'gongxue', label: '工学部' },
    { code: 'xinxixue', label: '信息学部' },
    { code: 'yixue', label: '医学部' },
    { code: 'surroundings', label: '周边商圈' },
];

const SORT_OPTIONS = [
    { value: 'rating', label: '评分优先' },
    { value: 'price', label: '价格最低' },
    { value: 'hot', label: '最受欢迎' },
    { value: 'new', label: '最新上架' },
];

const TAG_SUGGESTIONS = [
    '减脂', '高蛋白', '素食', '辣', '性价比', '夜宵', '早餐', '聚餐',
];

export default function ExploreContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [campus, setCampus] = useState(searchParams.get('campus') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'rating');
    const [priceMax, setPriceMax] = useState<number | undefined>(
        searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
    );
    const [selectedTags, setSelectedTags] = useState<string[]>(
        searchParams.get('tags')?.split(',').filter(Boolean) || [],
    );
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const doSearch = useCallback(async (p = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            if (campus) params.set('campus', campus);
            if (sort) params.set('sort', sort);
            if (priceMax) params.set('priceMax', String(priceMax));
            if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
            params.set('page', String(p));
            params.set('pageSize', '20');

            const res = await fetch(`/api/search?${params}`);
            const data = await res.json();

            if (data.success) {
                setResults(data.data);
                setTotalPages(data.pagination?.totalPages || 1);
                setPage(p);
            } else {
                setError(data.error || '搜索失败，请稍后重试');
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError('网络错误，请检查连接后重试');
        } finally {
            setLoading(false);
        }
    }, [query, campus, sort, priceMax, selectedTags]);

    useEffect(() => {
        const timer = setTimeout(() => doSearch(1), 300);
        return () => clearTimeout(timer);
    }, [query, campus, sort, priceMax, selectedTags]);

    function toggleTag(tag: string) {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">探索美食</h1>
                <p className="mt-2 text-muted-foreground">
                    搜索菜品、食堂，或输入自然语言如「减脂高蛋白」「20元以内」
                </p>
            </div>

            {/* 搜索栏 */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索菜品、食堂，或输入自然语言..."
                    className="w-full pl-12 pr-20 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query && (
                        <button onClick={() => setQuery('')} className="p-1.5 hover:bg-muted rounded-lg">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-1.5 rounded-lg transition-colors ${
                            showFilters ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* 快捷标签 */}
            <div className="flex flex-wrap gap-2 mb-4">
                {TAG_SUGGESTIONS.map(tag => (
                    <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* 筛选面板 */}
            {showFilters && (
                <div className="rounded-xl border bg-card p-4 mb-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">校区</label>
                        <div className="flex flex-wrap gap-2">
                            {CAMPUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.code}
                                    onClick={() => setCampus(opt.code)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                        campus === opt.code
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">排序</label>
                        <div className="flex flex-wrap gap-2">
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSort(opt.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                        sort === opt.value
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            最高价格: {priceMax ? `¥${priceMax}` : '不限'}
                        </label>
                        <input
                            type="range" min={5} max={100} step={5}
                            value={priceMax || 100}
                            onChange={(e) => setPriceMax(Number(e.target.value) || undefined)}
                            className="w-full"
                        />
                    </div>
                </div>
            )}

            {/* 结果 */}
            {error ? (
                <div className="text-center py-16">
                    <p className="text-destructive mb-4">{error}</p>
                    <button
                        onClick={() => doSearch(1)}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        重试
                    </button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border p-4 space-y-3 animate-pulse">
                            <div className="h-5 bg-muted rounded w-2/3" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="flex gap-2">
                                <div className="h-6 w-16 bg-muted rounded-full" />
                                <div className="h-6 w-16 bg-muted rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-16">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                        {query ? `没有找到"${query}"相关的结果` : '输入关键词开始搜索'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="text-sm text-muted-foreground mb-4">
                        找到 {results.length} 个结果
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map(result => (
                            <div
                                key={result.id}
                                className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold">{result.name}</h3>
                                    {result.score !== undefined && result.score > 0 && (
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {(result.score * 100).toFixed(0)}% 匹配
                                        </span>
                                    )}
                                </div>

                                {result.description && (
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {result.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                    {result.price !== undefined && (
                                        <span className="text-sm font-medium text-primary">¥{result.price}</span>
                                    )}
                                    {result.rating !== undefined && result.rating > 0 && (
                                        <span className="text-sm text-muted-foreground flex items-center gap-0.5">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            {result.rating.toFixed(1)}
                                        </span>
                                    )}
                                    {result.canteenName && (
                                        <span className="text-xs text-muted-foreground">{result.canteenName}</span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {result.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => doSearch(p)}
                                    className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                                        p === page
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
