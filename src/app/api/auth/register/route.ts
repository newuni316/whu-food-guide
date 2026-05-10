import { createMethodHandler, successResponse } from '@/lib/api/middleware';
import { ValidationError, AppError, ErrorCode } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(1, '请输入姓名').max(50),
    email: z.string().email('请输入有效的邮箱'),
    password: z.string().min(6, '密码至少6位').max(100),
});

export const POST = createMethodHandler({
    POST: async (request) => {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            throw new ValidationError(
                parsed.error.issues[0]?.message || '参数校验失败',
                { issues: parsed.error.issues },
            );
        }

        const { name, email, password } = parsed.data;

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
