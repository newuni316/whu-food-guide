'use client';

import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Moon, DollarSign, Dumbbell, Skull, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RankingItem {
    id: string;
    type: string;
    label: string;
    score: number;
    rank: number;
    canteen: {
        id: string;
        name: string;
        slug: string;
        campus: { name: string };
    };
}

const RANKING_CONFIGS = [
    { type: 'daily', label: '今日热门', gradient: 'from-orange-500 to-red-500', icon: Flame },
    { type: 'weekly', label: '本周热门', gradient: 'from-blue-500 to-purple-500', icon: TrendingUp },
    { type: 'night', label: '夜宵榜', gradient: 'from-indigo-500 to-purple-500', icon: Moon },
    { type: 'value', label: '性价比榜', gradient: 'from-green-500 to-emerald-500', icon: DollarSign },
    { type: 'fitness', label: '健身餐榜', gradient: 'from-cyan-500 to-teal-500', icon: Dumbbell },
    { type: 'dark', label: '黑暗料理榜', gradient: 'from-gray-500 to-zinc-500', icon: Skull },
];

export function RankingsContent() {
    const [rankings, setRankings] = useState<Record<string, RankingItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRankings() {
            try {
                const results: Record<string, RankingItem[]> = {};
                await Promise.all(
                    RANKING_CONFIGS.map(async (config) => {
                        const res = await fetch(`/api/rankings?type=${config.type}`);
                        const data = await res.json();
                        results[config.type] = data.success ? data.data : [];
                    }),
                );
                setRankings(results);
            } catch (err) {
                console.error('Failed to fetch rankings:', err);
                setError('排行榜数据加载失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        }
        fetchRankings();
    }, []);

    if (error) {
        return (
            <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    重试
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {RANKING_CONFIGS.map((config) => {
                    const Icon = config.icon;
                    return (
                        <Card key={config.type} className="overflow-hidden">
                            <div className={`bg-gradient-to-r ${config.gradient} p-4`}>
                                <div className="flex items-center gap-2 text-white">
                                    <Icon className="h-5 w-5" />
                                    <CardTitle className="text-lg">{config.label}</CardTitle>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {RANKING_CONFIGS.map((config) => {
                const Icon = config.icon;
                const items = rankings[config.type] || [];

                return (
                    <Card key={config.type} className="overflow-hidden">
                        <div className={`bg-gradient-to-r ${config.gradient} p-4`}>
                            <div className="flex items-center gap-2 text-white">
                                <Icon className="h-5 w-5" />
                                <CardTitle className="text-lg">{config.label}</CardTitle>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            {items.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    暂无数据
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-lg p-2.5 hover:bg-secondary transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                                        item.rank === 1
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : item.rank === 2
                                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                            : item.rank === 3
                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                            : 'bg-secondary text-muted-foreground'
                                                    }`}
                                                >
                                                    {item.rank}
                                                </span>
                                                <div>
                                                    <span className="text-sm font-medium block">
                                                        {item.canteen.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.canteen.campus.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                <span className="text-sm font-semibold text-primary">
                                                    {item.score.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
