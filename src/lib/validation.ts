/**
 * 统一请求验证层
 *
 * 提供类型安全的请求体验证，基于 Zod。
 */

import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

/**
 * 验证请求体
 *
 * @param schema - Zod schema
 * @param data   - 待验证数据
 * @returns 验证通过的类型安全数据
 * @throws ValidationError 验证失败时
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        const firstIssue = result.error.issues[0];
        const path = firstIssue?.path?.length ? `${firstIssue.path.join('.')}: ` : '';
        throw new ValidationError(`${path}${firstIssue?.message || '参数校验失败'}`);
    }
    return result.data;
}

/**
 * 安全验证（不抛异常）
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown):
    | { success: true; data: T }
    | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message || '参数校验失败' };
    }
    return { success: true, data: result.data };
}
