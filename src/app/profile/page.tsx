'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Heart, MessageSquare, Award, Settings, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserProfile {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    level: number;
    experience: number;
    dietTags: string[];
    profile: {
        bio: string | null;
        grade: string | null;
        major: string | null;
        studentId: string | null;
        campus: string | null;
    } | null;
    counts: {
        reviews: number;
        favorites: number;
        achievements: number;
    };
}

interface FavoriteItem {
    id: string;
    createdAt: string;
    dish: {
        id: string;
        name: string;
        price: number;
        avgRating: number;
        window: {
            name: string;
            canteen: { name: string };
        };
    };
}

const DIET_TAG_OPTIONS = [
    '减脂', '高蛋白', '素食', '辣', '早餐', '夜宵',
    '快餐', '聚餐', '性价比', '健身',
];

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'settings'>('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
            return;
        }
        if (status === 'authenticated') {
            fetchProfile();
            fetchFavorites();
        }
    }, [status]);

    async function fetchProfile() {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (data.success) setProfile(data.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchFavorites() {
        try {
            const res = await fetch('/api/user/favorites');
            const data = await res.json();
            if (data.success) setFavorites(data.data);
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
        }
    }

    async function handleRemoveFavorite(dishId: string) {
        try {
            await fetch(`/api/user/favorites?dishId=${dishId}`, { method: 'DELETE' });
            setFavorites(prev => prev.filter(f => f.dish.id !== dishId));
        } catch (err) {
            console.error('Failed to remove favorite:', err);
        }
    }

    async function handleSaveSettings(formData: FormData) {
        setSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    bio: formData.get('bio'),
                    major: formData.get('major'),
                    grade: formData.get('grade'),
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchProfile();
                setActiveTab('overview');
            }
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-muted rounded-xl" />
                    <div className="h-48 bg-muted rounded-xl" />
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* 用户信息卡片 */}
            <div className="rounded-xl border bg-card p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                        {profile.image ? (
                            <img src={profile.image} alt="" className="w-16 h-16 rounded-full" />
                        ) : (
                            <User className="h-8 w-8 text-primary" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{profile.name || '未设置昵称'}</h1>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        {profile.profile?.bio && (
                            <p className="text-sm mt-1">{profile.profile.bio}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Lv.{profile.level}</span>
                            <span>{profile.profile?.major || '未设置专业'}</span>
                            <span>{profile.profile?.grade || ''}</span>
                        </div>
                    </div>
                    <Badge variant={profile.role === 'admin' ? 'destructive' : 'secondary'}>
                        {profile.role === 'admin' ? '管理员' : '用户'}
                    </Badge>
                </div>

                {/* 画像标签 */}
                {profile.dietTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {profile.dietTags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                )}

                {/* 统计 */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{profile.counts.favorites}</div>
                        <div className="text-sm text-muted-foreground">收藏</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{profile.counts.reviews}</div>
                        <div className="text-sm text-muted-foreground">评价</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{profile.counts.achievements}</div>
                        <div className="text-sm text-muted-foreground">成就</div>
                    </div>
                </div>
            </div>

            {/* 标签页 */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: 'overview' as const, label: '概览', icon: User },
                    { key: 'favorites' as const, label: '收藏', icon: Heart },
                    { key: 'settings' as const, label: '设置', icon: Settings },
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* 概览 */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    <div className="rounded-xl border bg-card p-6">
                        <h2 className="font-semibold mb-4">快捷操作</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => router.push('/ai-chat')}
                                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                            >
                                <MessageSquare className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <div className="font-medium text-sm">AI 助手</div>
                                    <div className="text-xs text-muted-foreground">智能推荐美食</div>
                                </div>
                            </button>
                            <button
                                onClick={() => router.push('/explore')}
                                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                            >
                                <Heart className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <div className="font-medium text-sm">探索美食</div>
                                    <div className="text-xs text-muted-foreground">发现新口味</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 收藏列表 */}
            {activeTab === 'favorites' && (
                <div className="space-y-3">
                    {favorites.length === 0 ? (
                        <div className="text-center py-12">
                            <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">还没有收藏</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => router.push('/explore')}
                            >
                                去探索美食
                            </Button>
                        </div>
                    ) : (
                        favorites.map(fav => (
                            <div
                                key={fav.id}
                                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                            >
                                <div>
                                    <div className="font-medium">{fav.dish.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {fav.dish.window.canteen.name} · {fav.dish.window.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-medium text-primary">
                                            ¥{fav.dish.price}
                                        </span>
                                        {fav.dish.avgRating > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {fav.dish.avgRating.toFixed(1)}分
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveFavorite(fav.dish.id)}
                                >
                                    取消收藏
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 设置 */}
            {activeTab === 'settings' && (
                <form
                    action={(formData) => handleSaveSettings(formData)}
                    className="space-y-4"
                >
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <h2 className="font-semibold">个人信息</h2>

                        <div>
                            <label className="text-sm font-medium">昵称</label>
                            <input
                                name="name"
                                defaultValue={profile.name || ''}
                                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">简介</label>
                            <textarea
                                name="bio"
                                defaultValue={profile.profile?.bio || ''}
                                rows={3}
                                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">专业</label>
                                <input
                                    name="major"
                                    defaultValue={profile.profile?.major || ''}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">年级</label>
                                <input
                                    name="grade"
                                    defaultValue={profile.profile?.grade || ''}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-6">
                        <h2 className="font-semibold mb-4">饮食偏好</h2>
                        <div className="flex flex-wrap gap-2">
                            {DIET_TAG_OPTIONS.map(tag => {
                                const selected = profile.dietTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            const newTags = selected
                                                ? profile.dietTags.filter(t => t !== tag)
                                                : [...profile.dietTags, tag];
                                            setProfile({ ...profile, dietTags: newTags });
                                            fetch('/api/user/profile', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ dietTags: newTags }),
                                            });
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                            selected
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving ? '保存中...' : '保存修改'}
                    </Button>
                </form>
            )}
        </div>
    );
}
