/**
 * 缓存键管理
 *
 * 集中管理所有缓存键，避免键冲突。
 * 使用冒号分隔命名空间，如 "canteen:detail:abc123"
 */

export const CacheKeys = {
    // 食堂
    canteen: {
        list: (campus?: string) =>
            campus ? `canteen:list:${campus}` : 'canteen:list:all',
        detail: (slug: string) => `canteen:detail:${slug}`,
        windows: (canteenId: string) => `canteen:windows:${canteenId}`,
    },

    // 菜品
    dish: {
        detail: (id: string) => `dish:detail:${id}`,
        list: (windowId: string) => `dish:list:${windowId}`,
        search: (query: string) => `dish:search:${query}`,
    },

    // 排行榜
    ranking: {
        byType: (type: string, period: string) => `ranking:${type}:${period}`,
        all: (period: string) => `ranking:all:${period}`,
    },

    // 推荐
    recommend: {
        user: (userId: string) => `recommend:user:${userId}`,
        query: (queryHash: string) => `recommend:query:${queryHash}`,
    },

    // AI 对话
    chat: {
        history: (userId: string) => `chat:history:${userId}`,
    },

    // 用户
    user: {
        profile: (userId: string) => `user:profile:${userId}`,
        favorites: (userId: string) => `user:favorites:${userId}`,
    },

    // 搜索
    search: {
        semantic: (query: string) => `search:semantic:${query}`,
    },
} as const;

/** 缓存 TTL（秒） */
export const CacheTTL = {
    SHORT: 60,           // 1 分钟 — 频繁变化的数据
    MEDIUM: 300,         // 5 分钟 — 一般数据
    LONG: 1800,          // 30 分钟 — 较稳定数据
    VERY_LONG: 3600,     // 1 小时 — 很少变化的数据
    RANKING: 300,        // 5 分钟 — 排行榜
    SEARCH: 120,         // 2 分钟 — 搜索结果
    RECOMMEND: 600,      // 10 分钟 — 推荐结果
} as const;
