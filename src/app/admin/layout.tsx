import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, UtensilsCrossed, MessageSquare, Users, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: '管理后台 — 珞珈美食指南',
};

const NAV_ITEMS = [
    { href: '/admin', label: '数据概览', icon: LayoutDashboard },
    { href: '/admin/canteens', label: '食堂管理', icon: UtensilsCrossed },
    { href: '/admin/reviews', label: '评论审核', icon: MessageSquare },
    { href: '/admin/users', label: '用户管理', icon: Users },
];

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
        redirect('/');
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            {/* 侧边栏 */}
            <aside className="w-56 border-r bg-card p-4 hidden md:block">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回首页
                </Link>

                <nav className="space-y-1">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* 主内容 */}
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}
