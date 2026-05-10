import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminCanteensPage() {
    const canteens = await prisma.canteen.findMany({
        where: { deletedAt: null },
        include: {
            campus: true,
            _count: { select: { windows: true, reviews: true } },
        },
        orderBy: { avgRating: 'desc' },
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">食堂管理</h1>

            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-3 font-medium">食堂</th>
                            <th className="text-left p-3 font-medium">校区</th>
                            <th className="text-left p-3 font-medium">评分</th>
                            <th className="text-left p-3 font-medium">窗口</th>
                            <th className="text-left p-3 font-medium">评价</th>
                            <th className="text-left p-3 font-medium">状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        {canteens.map(canteen => (
                            <tr key={canteen.id} className="border-t hover:bg-muted/30">
                                <td className="p-3">
                                    <div className="font-medium">{canteen.name}</div>
                                    <div className="text-xs text-muted-foreground">{canteen.address}</div>
                                </td>
                                <td className="p-3">
                                    <Badge variant="outline">{canteen.campus.name}</Badge>
                                </td>
                                <td className="p-3">
                                    <span className="font-medium">{canteen.avgRating.toFixed(1)}</span>
                                </td>
                                <td className="p-3">{canteen._count.windows}</td>
                                <td className="p-3">{canteen._count.reviews}</td>
                                <td className="p-3">
                                    {canteen.isOpen ? (
                                        <Badge variant="default" className="bg-green-500">营业中</Badge>
                                    ) : (
                                        <Badge variant="secondary">已关闭</Badge>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
