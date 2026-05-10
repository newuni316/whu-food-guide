import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        where: { deletedAt: null },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            profile: true,
            _count: {
                select: { reviews: true, favorites: true },
            },
        },
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">用户管理</h1>

            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-3 font-medium">用户</th>
                            <th className="text-left p-3 font-medium">邮箱</th>
                            <th className="text-left p-3 font-medium">角色</th>
                            <th className="text-left p-3 font-medium">评价</th>
                            <th className="text-left p-3 font-medium">收藏</th>
                            <th className="text-left p-3 font-medium">注册时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t hover:bg-muted/30">
                                <td className="p-3">
                                    <div className="font-medium">{user.name || '未设置'}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.profile?.major || ''} {user.profile?.grade || ''}
                                    </div>
                                </td>
                                <td className="p-3 text-muted-foreground">{user.email}</td>
                                <td className="p-3">
                                    <Badge variant={
                                        user.role === 'superadmin' ? 'destructive' :
                                        user.role === 'admin' ? 'default' : 'secondary'
                                    }>
                                        {user.role}
                                    </Badge>
                                </td>
                                <td className="p-3">{user._count.reviews}</td>
                                <td className="p-3">{user._count.favorites}</td>
                                <td className="p-3 text-muted-foreground">
                                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
