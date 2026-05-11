import { createMethodHandler, successResponse, withAuth } from '@/lib/api/middleware';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { invalidateCache } from '@/lib/cache/redis';
import { CacheKeys } from '@/lib/cache/keys';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    bio: z.string().max(200).optional(),
    phone: z.string().max(20).optional(),
    grade: z.string().max(20).optional(),
    major: z.string().max(50).optional(),
    studentId: z.string().max(20).optional(),
    campus: z.string().max(20).optional(),
    dietTags: z.array(z.string()).max(10).optional(),
});

/** GET — 获取当前用户画像 */
export const GET = createMethodHandler({
    GET: withAuth(async (request) => {
        const userId = request.session.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                _count: {
                    select: {
                        reviews: true,
                        favorites: true,
                        achievements: true,
                    },
                },
            },
        });

        if (!user) throw new NotFoundError('用户');

        return successResponse({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            level: user.level,
            experience: user.experience,
            dietTags: user.dietTags,
            profile: user.profile,
            counts: user._count,
            createdAt: user.createdAt,
        });
    }),
});

/** PUT — 更新用户画像 */
export const PUT = createMethodHandler({
    PUT: withAuth(async (request) => {
        const userId = request.session.user.id;
        const body = await request.json();

        const parsed = updateProfileSchema.safeParse(body);
        if (!parsed.success) {
            throw new ValidationError(parsed.error.issues[0]?.message || '参数校验失败');
        }

        const { name, dietTags, ...profileData } = parsed.data;

        // 更新 User 表
        const userUpdate: Record<string, unknown> = {};
        if (name !== undefined) userUpdate.name = name;
        if (dietTags !== undefined) userUpdate.dietTags = dietTags;

        if (Object.keys(userUpdate).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: userUpdate,
            });
        }

        // 更新 Profile 表
        if (Object.keys(profileData).length > 0) {
            await prisma.profile.upsert({
                where: { userId },
                create: { userId, ...profileData },
                update: profileData,
            });
        }

        await invalidateCache(CacheKeys.user.profile(userId));

        return successResponse({ success: true });
    }),
});
