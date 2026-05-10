/**
 * 种子数据脚本
 *
 * 导入食堂/菜品数据，创建测试用户，生成排行榜和模拟评价。
 * 使用新的 Prisma Schema（Campus/Canteen/Window/Dish）。
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), 'data', 'restaurants');

// ──────────────────────────────────────────────
// 类型定义
// ──────────────────────────────────────────────

interface RestaurantData {
    name: string;
    slug: string;
    campus: string;
    area: string;
    category: string[];
    price_range: number[];
    rating: { taste: number; environment: number; value: number };
    coordinates: { lat: number; lng: number };
    address: string;
    hours: string;
    phone?: string;
    images?: string[];
    recommendations: string[];
    tags: string[];
    review?: string;
    source: string;
    last_verified: string;
    contributor?: string;
}

// ──────────────────────────────────────────────
// 常量
// ──────────────────────────────────────────────

const CAMPUSES = [
    { name: '文理学部', code: 'wenli', order: 1 },
    { name: '工学部', code: 'gongxue', order: 2 },
    { name: '信息学部', code: 'xinxixue', order: 3 },
    { name: '医学部', code: 'yixue', order: 4 },
    { name: '周边商圈', code: 'surroundings', order: 5 },
];

const RANKING_TYPES = [
    { type: 'daily', label: '今日热门' },
    { type: 'weekly', label: '本周热门' },
    { type: 'night', label: '夜宵榜' },
    { type: 'value', label: '性价比榜' },
    { type: 'fitness', label: '健身餐榜' },
    { type: 'dark', label: '黑暗料理榜' },
];

/** 菜品营养数据模板 */
const NUTRITION_TEMPLATES: Record<string, { calories: number; protein: number; fat: number; carbs: number }> = {
    '快餐': { calories: 450, protein: 20, fat: 15, carbs: 55 },
    '面食': { calories: 380, protein: 12, fat: 8, carbs: 65 },
    '烧烤': { calories: 550, protein: 25, fat: 30, carbs: 35 },
    '火锅': { calories: 600, protein: 22, fat: 35, carbs: 40 },
    '正餐': { calories: 500, protein: 18, fat: 20, carbs: 60 },
    '小吃': { calories: 300, protein: 8, fat: 12, carbs: 42 },
    '早餐': { calories: 350, protein: 10, fat: 10, carbs: 55 },
    '饮品': { calories: 150, protein: 3, fat: 2, carbs: 30 },
    '甜品': { calories: 280, protein: 4, fat: 8, carbs: 50 },
    '咖啡': { calories: 120, protein: 2, fat: 4, carbs: 18 },
};

/** 模拟评价模板 */
const REVIEW_TEMPLATES = [
    { content: '味道不错，性价比很高，推荐！', rating: 5, sentiment: 0.8 },
    { content: '分量很足，吃得饱饱的', rating: 4, sentiment: 0.6 },
    { content: '环境一般，但菜品味道好', rating: 4, sentiment: 0.4 },
    { content: '排队时间有点长，但值得等', rating: 4, sentiment: 0.3 },
    { content: '价格实惠，学生党的福音', rating: 5, sentiment: 0.7 },
    { content: '菜品有点咸，希望改进', rating: 3, sentiment: -0.2 },
    { content: '服务态度很好，会再来', rating: 5, sentiment: 0.7 },
    { content: '适合减脂，低卡高蛋白', rating: 4, sentiment: 0.5 },
    { content: '和同学聚餐的好去处', rating: 5, sentiment: 0.8 },
    { content: '味道一般般，没有特别惊艳', rating: 3, sentiment: 0.0 },
    { content: '分量变少了，但味道提升了', rating: 4, sentiment: 0.2 },
    { content: '深夜还能吃到，太幸福了', rating: 5, sentiment: 0.9 },
    { content: '价格偏贵，不过食材新鲜', rating: 3, sentiment: 0.1 },
    { content: '窗口阿姨人很好，每次都多打菜', rating: 5, sentiment: 0.8 },
    { content: '吃了一学期了，百吃不腻', rating: 5, sentiment: 0.9 },
];

// ──────────────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────────────

function mapCampusCode(campus: string): string {
    const map: Record<string, string> = {
        wenli: 'wenli',
        gongxue: 'gongxue',
        xinxixue: 'xinxixue',
        yixue: 'yixue',
        surroundings: 'surroundings',
    };
    return map[campus] || 'wenli';
}

function parseHours(hoursStr: string): Record<string, { open: string; close: string }> {
    // "11:00-21:00" -> { mon: { open: "11:00", close: "21:00" }, ... }
    const match = hoursStr.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
    if (!match) {
        return {
            mon: { open: '07:00', close: '21:00' },
            tue: { open: '07:00', close: '21:00' },
            wed: { open: '07:00', close: '21:00' },
            thu: { open: '07:00', close: '21:00' },
            fri: { open: '07:00', close: '21:00' },
            sat: { open: '07:00', close: '21:00' },
            sun: { open: '07:00', close: '21:00' },
        };
    }

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const hours: Record<string, { open: string; close: string }> = {};
    for (const day of days) {
        hours[day] = { open: match[1], close: match[2] };
    }
    return hours;
}

function getNutrition(category: string[]): { calories: number; protein: number; fat: number; carbs: number } {
    for (const cat of category) {
        if (NUTRITION_TEMPLATES[cat]) {
            const base = NUTRITION_TEMPLATES[cat];
            // 加入随机波动 ±20%
            const variation = 0.8 + Math.random() * 0.4;
            return {
                calories: Math.round(base.calories * variation),
                protein: Math.round(base.protein * variation * 10) / 10,
                fat: Math.round(base.fat * variation * 10) / 10,
                carbs: Math.round(base.carbs * variation * 10) / 10,
            };
        }
    }
    return { calories: 400, protein: 15, fat: 15, carbs: 50 };
}

function getDishTags(dishName: string, canteenTags: string[]): string[] {
    const tags = new Set<string>();

    // 根据菜品名推断标签
    if (/鸡胸|沙拉|低脂|轻食/.test(dishName)) tags.add('减脂');
    if (/鸡|牛肉|蛋白/.test(dishName)) tags.add('高蛋白');
    if (/素|青菜|豆腐/.test(dishName)) tags.add('素食');
    if (/辣|麻辣|川/.test(dishName)) tags.add('辣');
    if (/粥|豆浆|饼|包子/.test(dishName)) tags.add('早餐');
    if (/烧烤|串|炸/.test(dishName)) tags.add('夜宵');

    // 继承食堂标签
    for (const tag of canteenTags.slice(0, 2)) {
        tags.add(tag);
    }

    return [...tags];
}

function randomPrice(range: number[]): number {
    if (range.length >= 2) {
        const min = range[0];
        const max = range[1];
        return Math.round((min + Math.random() * (max - min)) * 10) / 10;
    }
    return range[0] || 15;
}

// ──────────────────────────────────────────────
// 种子函数
// ──────────────────────────────────────────────

async function seedCampuses(): Promise<Map<string, string>> {
    console.log('🏫 创建校区数据...');
    const campusMap = new Map<string, string>();

    for (const campus of CAMPUSES) {
        const result = await prisma.campus.upsert({
            where: { code: campus.code },
            update: { name: campus.name, order: campus.order },
            create: campus,
        });
        campusMap.set(campus.code, result.id);
    }

    console.log(`  ✅ 创建了 ${CAMPUSES.length} 个校区`);
    return campusMap;
}

async function seedUsers() {
    console.log('👤 创建测试用户...');
    const passwordHash = await bcrypt.hash('123456', 12);

    const users = [
        {
            name: '张三',
            email: 'zhangsan@whu.edu.cn',
            role: 'user' as UserRole,
            dietTags: ['减脂', '性价比'],
        },
        {
            name: '李四',
            email: 'lisi@whu.edu.cn',
            role: 'user' as UserRole,
            dietTags: ['健身', '高蛋白'],
        },
        {
            name: '管理员',
            email: 'admin@whu.edu.cn',
            role: 'admin' as UserRole,
            dietTags: [],
        },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { dietTags: u.dietTags },
            create: {
                name: u.name,
                email: u.email,
                passwordHash,
                role: u.role,
                dietTags: u.dietTags,
                profile: {
                    create: {
                        bio: `WHU ${u.name}`,
                        grade: '2024',
                        major: '计算机科学与技术',
                        studentId: `2024${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
                        campus: 'wenli',
                    },
                },
            },
        });
    }

    console.log(`  ✅ 创建了 ${users.length} 个测试用户 (密码: 123456)`);
}

async function seedCanteensAndDishes(
    campusMap: Map<string, string>,
): Promise<{ canteenId: string; name: string; avgRating: number; dishIds: string[] }[]> {
    console.log('\n🍽️ 导入食堂和菜品数据...');
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && f !== 'template.json');

    const results: { canteenId: string; name: string; avgRating: number; dishIds: string[] }[] = [];

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        const data: RestaurantData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const campusId = campusMap.get(mapCampusCode(data.campus));
        if (!campusId) {
            console.warn(`  ⚠️ 跳过 ${data.name}: 找不到校区 ${data.campus}`);
            continue;
        }

        console.log(`  导入: ${data.name}`);

        const avgRating = data.rating
            ? parseFloat(((data.rating.taste + data.rating.environment + data.rating.value) / 3).toFixed(1))
            : 4.0;

        // 创建/更新食堂
        const canteen = await prisma.canteen.upsert({
            where: { slug: data.slug },
            update: {
                name: data.name,
                campusId,
                address: data.address,
                latitude: data.coordinates.lat,
                longitude: data.coordinates.lng,
                phone: data.phone || null,
                hours: parseHours(data.hours),
                images: data.images || [],
                tags: data.tags,
                avgRating,
                description: data.review || null,
            },
            create: {
                name: data.name,
                slug: data.slug,
                campusId,
                address: data.address,
                latitude: data.coordinates.lat,
                longitude: data.coordinates.lng,
                phone: data.phone || null,
                hours: parseHours(data.hours),
                images: data.images || [],
                tags: data.tags,
                avgRating,
                description: data.review || null,
            },
        });

        // 创建主窗口
        const windowId = `${canteen.id}-main`;
        const window = await prisma.window.upsert({
            where: { id: windowId },
            update: {
                name: `${data.name}主窗口`,
                category: data.category,
                priceMin: data.price_range[0] || 0,
                priceMax: data.price_range[1] || 50,
                tags: data.tags,
                description: data.review || null,
                avgRating,
            },
            create: {
                id: windowId,
                name: `${data.name}主窗口`,
                canteenId: canteen.id,
                category: data.category,
                priceMin: data.price_range[0] || 0,
                priceMax: data.price_range[1] || 50,
                tags: data.tags,
                description: data.review || null,
                avgRating,
            },
        });

        // 创建菜品
        const dishIds: string[] = [];
        for (const dishName of data.recommendations) {
            const dishId = `${window.id}-${dishName.replace(/[^a-zA-Z0-9一-龥]/g, '')}`;
            const price = randomPrice(data.price_range);
            const nutrition = getNutrition(data.category);
            const dishTags = getDishTags(dishName, data.tags);

            await prisma.dish.upsert({
                where: { id: dishId },
                update: {
                    name: dishName,
                    price,
                    category: data.category[0] || '其他',
                    tags: dishTags,
                    calories: nutrition.calories,
                    protein: nutrition.protein,
                    fat: nutrition.fat,
                    carbs: nutrition.carbs,
                    avgRating: parseFloat((avgRating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                },
                create: {
                    id: dishId,
                    name: dishName,
                    windowId: window.id,
                    price,
                    category: data.category[0] || '其他',
                    tags: dishTags,
                    calories: nutrition.calories,
                    protein: nutrition.protein,
                    fat: nutrition.fat,
                    carbs: nutrition.carbs,
                    avgRating: parseFloat((avgRating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                    description: `${dishName}，${data.name}的招牌菜品`,
                },
            });

            dishIds.push(dishId);
        }

        results.push({ canteenId: canteen.id, name: data.name, avgRating, dishIds });
    }

    console.log(`  ✅ 导入了 ${results.length} 个食堂`);
    return results;
}

async function seedRankings(
    canteens: { canteenId: string; name: string; avgRating: number }[],
) {
    console.log('\n📊 创建排行榜数据...');
    const today = new Date().toISOString().split('T')[0];

    for (const { canteenId, avgRating } of canteens) {
        for (const rankingType of RANKING_TYPES) {
            const scoreVariation = Math.random() * 1.0 - 0.5;
            const finalScore = parseFloat(Math.max(1, Math.min(5, avgRating + scoreVariation)).toFixed(1));

            await prisma.ranking.upsert({
                where: {
                    id: `${canteenId}-${rankingType.type}`,
                },
                update: {
                    score: finalScore,
                    label: rankingType.label,
                    rank: 1,
                    period: today,
                },
                create: {
                    id: `${canteenId}-${rankingType.type}`,
                    type: rankingType.type,
                    label: rankingType.label,
                    score: finalScore,
                    rank: 1,
                    canteenId,
                    period: today,
                },
            });
        }
    }

    // 重新排序
    for (const rt of RANKING_TYPES) {
        const rankings = await prisma.ranking.findMany({
            where: { type: rt.type, period: today },
            orderBy: { score: 'desc' },
        });
        for (let i = 0; i < rankings.length; i++) {
            await prisma.ranking.update({
                where: { id: rankings[i].id },
                data: { rank: i + 1 },
            });
        }
    }

    console.log(`  ✅ 创建了 ${RANKING_TYPES.length} 种排行榜`);
}

async function seedReviews(dishIds: string[]) {
    console.log('\n💬 创建模拟评价...');

    // 获取测试用户
    const users = await prisma.user.findMany({
        where: { role: 'user' },
        select: { id: true },
    });

    if (users.length === 0) {
        console.log('  ⚠️ 没有用户，跳过评价');
        return;
    }

    let reviewCount = 0;

    for (const dishId of dishIds) {
        // 每个菜品随机 2-4 条评价
        const count = 2 + Math.floor(Math.random() * 3);
        const selectedReviews = REVIEW_TEMPLATES
            .sort(() => Math.random() - 0.5)
            .slice(0, count);

        for (const review of selectedReviews) {
            const user = users[Math.floor(Math.random() * users.length)];
            const keywords = extractSimpleKeywords(review.content);

            await prisma.review.create({
                data: {
                    content: review.content,
                    rating: review.rating,
                    sentiment: review.sentiment,
                    keywords,
                    userId: user.id,
                    dishId,
                },
            });
            reviewCount++;
        }
    }

    // 更新菜品的 reviewCount
    for (const dishId of dishIds) {
        const count = await prisma.review.count({ where: { dishId } });
        await prisma.dish.update({
            where: { id: dishId },
            data: { reviewCount: count },
        });
    }

    console.log(`  ✅ 创建了 ${reviewCount} 条评价`);
}

/** 简单关键词提取（不依赖 LLM） */
function extractSimpleKeywords(text: string): string[] {
    const keywords: string[] = [];
    const patterns = [
        /好吃|不错|推荐|很棒|美味|划算|实惠|量大/,
        /难吃|差|失望|贵|少|慢|一般/,
        /减脂|高蛋白|素食|辣|早餐|夜宵/,
        /环境|服务|排队|干净|新鲜/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) keywords.push(match[0]);
    }

    return keywords.slice(0, 3);
}

// ──────────────────────────────────────────────
// 主函数
// ──────────────────────────────────────────────

async function seed() {
    console.log('🌱 开始导入数据...\n');

    // 1. 创建校区
    const campusMap = await seedCampuses();

    // 2. 创建用户
    await seedUsers();

    // 3. 创建食堂和菜品
    const canteens = await seedCanteensAndDishes(campusMap);

    // 4. 创建排行榜
    await seedRankings(canteens);

    // 5. 创建模拟评价
    const allDishIds = canteens.flatMap(c => c.dishIds);
    await seedReviews(allDishIds);

    // 6. 尝试生成 embeddings（如果 API key 可用）
    if (process.env.OPENAI_API_KEY) {
        console.log('\n🧮 生成菜品向量嵌入...');
        try {
            const { batchEmbedAllDishes } = await import('@/lib/ai/embedding');
            const count = await batchEmbedAllDishes();
            console.log(`  ✅ 生成了 ${count} 个向量嵌入`);
        } catch (error) {
            console.warn(`  ⚠️ 向量嵌入生成失败: ${(error as Error).message}`);
        }
    } else {
        console.log('\n⏭️ 跳过向量嵌入（未设置 OPENAI_API_KEY）');
    }

    // 统计
    const stats = {
        campuses: await prisma.campus.count(),
        canteens: await prisma.canteen.count(),
        windows: await prisma.window.count(),
        dishes: await prisma.dish.count(),
        reviews: await prisma.review.count(),
        rankings: await prisma.ranking.count(),
        users: await prisma.user.count(),
    };

    console.log('\n' + '═'.repeat(50));
    console.log('✅ 数据导入完成!');
    console.log('═'.repeat(50));
    console.log(`   🏫 ${stats.campuses} 个校区`);
    console.log(`   🍽️ ${stats.canteens} 个食堂`);
    console.log(`   🪟 ${stats.windows} 个窗口`);
    console.log(`   🥘 ${stats.dishes} 个菜品`);
    console.log(`   💬 ${stats.reviews} 条评价`);
    console.log(`   📊 ${stats.rankings} 条排行`);
    console.log(`   👤 ${stats.users} 个用户`);
    console.log('\n💡 测试账号 (密码: 123456):');
    console.log('   - 管理员: admin@whu.edu.cn');
    console.log('   - 普通用户: zhangsan@whu.edu.cn');
    console.log('   - 普通用户: lisi@whu.edu.cn');
}

seed()
    .catch(e => {
        console.error('❌ 种子数据导入失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
