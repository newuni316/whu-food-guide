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
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), interest-cohort=()');
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
            "font-src 'self' data:",
            "connect-src 'self' https://api.openai.com https://api.deepseek.com https://*.amap.com https://restapi.amap.com",
            "frame-ancestors 'none'",
        ].join('; '),
    );

    // 静态资源和 API 跳过（matcher 已排除带扩展名的文件）
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon')
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
