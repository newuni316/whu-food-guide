/**
 * 清理菜品和评价数据
 *
 * 按外键依赖顺序删除：BrowsingHistory → Favorite → PriceHistory → DishEmbedding → Review → Dish
 * 然后重置 Window/Canteen 的 reviewCount 和 avgRating 为 0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDishAndReviewData() {
    console.log('🧹 开始清理菜品和评价数据...\n');

    // 1. 删除浏览历史（引用 Dish）
    const browsing = await prisma.browsingHistory.deleteMany();
    console.log(`  🗑️ 删除了 ${browsing.count} 条浏览历史`);

    // 2. 删除收藏（引用 Dish）
    const favorites = await prisma.favorite.deleteMany();
    console.log(`  🗑️ 删除了 ${favorites.count} 条收藏`);

    // 3. 删除价格历史（引用 Dish）
    const priceHistory = await prisma.priceHistory.deleteMany();
    console.log(`  🗑️ 删除了 ${priceHistory.count} 条价格历史`);

    // 4. 删除菜品向量嵌入（引用 Dish）
    const embeddings = await prisma.dishEmbedding.deleteMany();
    console.log(`  🗑️ 删除了 ${embeddings.count} 条向量嵌入`);

    // 5. 删除评价（引用 Dish）
    const reviews = await prisma.review.deleteMany();
    console.log(`  🗑️ 删除了 ${reviews.count} 条评价`);

    // 6. 删除菜品（引用 Window）
    const dishes = await prisma.dish.deleteMany();
    console.log(`  🗑️ 删除了 ${dishes.count} 道菜品`);

    // 7. 重置窗口的评分和评价数
    const windows = await prisma.window.updateMany({
        data: { avgRating: 0, reviewCount: 0 },
    });
    console.log(`  🔄 重置了 ${windows.count} 个窗口的评分`);

    // 8. 重置食堂的评分和评价数
    const canteens = await prisma.canteen.updateMany({
        data: { avgRating: 0, reviewCount: 0 },
    });
    console.log(`  🔄 重置了 ${canteens.count} 个食堂的评分`);

    console.log('\n✅ 清理完成!');
}

clearDishAndReviewData()
    .catch(e => {
        console.error('❌ 清理失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
