/**
 * 统一类型定义 — WHU Food Guide
 *
 * 集中管理 API 请求/响应、领域模型、枚举等类型，
 * 确保前后端类型一致性。
 */

import type { Prisma } from '@prisma/client';

// ──────────────────────────────────────────────
// API 通用
// ──────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    pagination?: Pagination;
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// 食堂 / 窗口 / 菜品
// ──────────────────────────────────────────────

export type CanteenWithRelations = Prisma.CanteenGetPayload<{
    include: {
        campus: true;
        windows: { include: { dishes: true } };
    };
}>;

export type CanteenSummary = Prisma.CanteenGetPayload<{
    include: { campus: true };
}>;

export type WindowWithDishes = Prisma.WindowGetPayload<{
    include: { dishes: true };
}>;

export type DishWithRelations = Prisma.DishGetPayload<{
    include: {
        window: { include: { canteen: { include: { campus: true } } } };
        reviews: true;
        _count: { select: { favorites: true; reviews: true } };
    };
}>;

export type DishSummary = Prisma.DishGetPayload<{
    include: { window: { include: { canteen: true } } };
}>;

// ──────────────────────────────────────────────
// 推荐系统
// ──────────────────────────────────────────────

export interface RecommendRequest {
    query: string;
    budget?: number;
    diet?: string[];       // [减脂, 高蛋白, 素食]
    tags?: string[];       // 额外标签过滤
    location?: string;     // 校区名
    time?: string;         // 早餐/午餐/晚餐/夜宵
    excludeIds?: string[]; // 排除的菜品ID
}

export interface RecommendResult {
    dish: DishSummary;
    score: number;
    reason: string;
    matchTags: string[];
}

export interface RecommendResponse {
    results: RecommendResult[];
    aiResponse: string;    // AI 生成的推荐总结
    query: string;
    context: RecommendRequest;
}

// ──────────────────────────────────────────────
// 搜索
// ──────────────────────────────────────────────

export interface SearchParams {
    q?: string;
    campus?: string;       // 校区 code
    category?: string;
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
    sort?: 'rating' | 'price' | 'hot' | 'new';
    page?: number;
    pageSize?: number;
    skip?: number;
}

export interface SearchResult {
    type: 'dish' | 'canteen' | 'window';
    id: string;
    name: string;
    description?: string;
    price?: number;
    rating?: number;
    tags: string[];
    canteenName?: string;
    campusName?: string;
    score?: number;        // 语义搜索相关度
}

// ──────────────────────────────────────────────
// 评价
// ──────────────────────────────────────────────

export interface CreateReviewRequest {
    dishId: string;
    canteenId?: string;
    content: string;
    rating: number;        // 1-5
    images?: string[];
}

export type ReviewWithUser = Prisma.ReviewGetPayload<{
    include: {
        user: { select: { id: true; name: true; image: true } };
        _count: { select: { replies: true } };
    };
}>;


// ──────────────────────────────────────────────
// AI 对话
// ──────────────────────────────────────────────

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    context?: {
        budget?: number;
        diet?: string[];
        location?: string;
        time?: string;
    };
}

export interface ChatResponse {
    content: string;
    recommendations?: RecommendResult[];
}

// ──────────────────────────────────────────────
// 用户
// ──────────────────────────────────────────────

export interface UserProfile {
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
}

// ──────────────────────────────────────────────
// 排行榜
// ──────────────────────────────────────────────

export type RankingType = 'daily' | 'weekly' | 'night' | 'value' | 'fitness' | 'dark';

export interface RankingItem {
    rank: number;
    canteenId: string;
    canteenName: string;
    campusName: string;
    score: number;
    slug: string;
}

// ──────────────────────────────────────────────
// 营养信息
// ──────────────────────────────────────────────

export interface NutritionInfo {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
}

// ──────────────────────────────────────────────
// 地图
// ──────────────────────────────────────────────

export interface MapMarker {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    campus: string;
    slug: string;
    rating: number;
    isOpen: boolean;
}
