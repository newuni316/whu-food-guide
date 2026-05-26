import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const findFirst = vi.fn();
const update = vi.fn();
const logAdmin = vi.fn();
const invalidateDashboardCache = vi.fn();

vi.mock('@/lib/auth', () => ({
    auth,
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst,
            update,
        },
    },
}));

vi.mock('@/lib/admin-log', () => ({
    logAdmin,
    invalidateDashboardCache,
}));

async function loadRoute() {
    vi.resetModules();
    return import('@/app/api/admin/users/[id]/route');
}

describe('DELETE /api/admin/users/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        findFirst.mockResolvedValue({
            id: 'user-1',
            role: 'user',
            name: 'Alice',
            email: 'alice@example.com',
        });
        update.mockResolvedValue({ id: 'user-1' });
        invalidateDashboardCache.mockResolvedValue(undefined);
        logAdmin.mockResolvedValue(undefined);
    });

    it('returns 403 for admin users', async () => {
        auth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });

        const { DELETE } = await loadRoute();
        const response = await DELETE(
            new Request('http://localhost/api/admin/users/user-1', { method: 'DELETE' }),
            { params: Promise.resolve({ id: 'user-1' }) },
        );

        expect(response.status).toBe(403);
        expect(findFirst).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();

        const body = await response.json();
        expect(body).toMatchObject({
            success: false,
            error: {
                code: 'FORBIDDEN',
            },
        });
    });

    it('allows superadmin to soft-delete users and keeps side effects', async () => {
        auth.mockResolvedValue({ user: { id: 'superadmin-1', role: 'superadmin' } });

        const { DELETE } = await loadRoute();
        const response = await DELETE(
            new Request('http://localhost/api/admin/users/user-1', { method: 'DELETE' }),
            { params: Promise.resolve({ id: 'user-1' }) },
        );

        expect(response.status).toBe(200);
        expect(findFirst).toHaveBeenCalledWith({ where: { id: 'user-1', deletedAt: null } });
        expect(update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { deletedAt: expect.any(Date) },
        });
        expect(logAdmin).toHaveBeenCalledWith(
            expect.any(Request),
            'delete_user',
            'user-1',
            { name: 'Alice', email: 'alice@example.com' },
        );
        expect(invalidateDashboardCache).toHaveBeenCalled();

        const body = await response.json();
        expect(body).toMatchObject({
            success: true,
            data: { id: 'user-1' },
        });
    });
});
