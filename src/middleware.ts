/**
 * Next.js 中间件
 *
 * 路由保护 + 安全头 + 重定向
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/** 需要登录的路由 */
const PROTECTED_ROUTES = ['/profile', '/admin'];

/** 需要管理员权限的路由 */
const ADMIN_ROUTES = ['/admin'];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // 安全头
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 静态资源和 API 跳过
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return response;
    }

    // 受保护路由检查
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    if (isProtected && !req.auth) {
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 管理员路由检查
    const isAdmin = ADMIN_ROUTES.some(route => pathname.startsWith(route));
    if (isAdmin && req.auth?.user?.role !== 'admin' && req.auth?.user?.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return response;
});

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};
