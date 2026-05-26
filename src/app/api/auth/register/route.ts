import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/cache/rate-limit';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().trim().min(1, '请输入姓名').max(50),
    email: z.string().trim().email('请输入有效的邮箱').transform(email => email.toLowerCase()),
    password: z.string().min(6, '密码至少6位').max(100),
});

export const POST = createMethodHandler({
    POST: async (request) => {
        const ip = getClientIp(request);
        const rateLimit = await checkRateLimit(`auth:register:${ip}`, 5, 15 * 60);
        if (!rateLimit.allowed) {
            throw new AppError(ErrorCode.RATE_LIMITED, '注册过于频繁，请稍后再试');
        }

        const body = validateRequest(registerSchema, await request.json());
        const { email, name, password } = body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new AppError(ErrorCode.CONFLICT, '该邮箱已被注册');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.user.create({
            data: { name, email, passwordHash },
        });

        return successResponse({ success: true }, undefined, 201);
    },
});
