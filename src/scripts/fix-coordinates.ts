/**
 * 坐标修正脚本
 *
 * 将数据库中所有食堂的 GCJ-02 坐标转换为 WGS-84。
 * 运行一次即可：npx tsx src/scripts/fix-coordinates.ts
 */

import { PrismaClient } from '@prisma/client';
import { gcj02ToWgs84 } from '@/lib/coords';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 开始修正食堂坐标 (GCJ-02 → WGS-84)...\n');

    const canteens = await prisma.canteen.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, latitude: true, longitude: true },
    });

    let updated = 0;
    for (const c of canteens) {
        const [wgsLng, wgsLat] = gcj02ToWgs84(c.longitude, c.latitude);

        const latDiff = Math.abs(wgsLat - c.latitude);
        const lngDiff = Math.abs(wgsLng - c.longitude);

        if (latDiff < 0.00001 && lngDiff < 0.00001) {
            console.log(`  ⏭️  ${c.name}: 偏移极小，跳过`);
            continue;
        }

        await prisma.canteen.update({
            where: { id: c.id },
            data: { latitude: wgsLat, longitude: wgsLng },
        });

        console.log(
            `  ✅ ${c.name}: [${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}] → [${wgsLat.toFixed(6)}, ${wgsLng.toFixed(6)}]`,
        );
        updated++;
    }

    console.log(`\n🎉 完成！修正了 ${updated}/${canteens.length} 个食堂坐标。`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
