import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkRateLimit = vi.fn();
const getClientIp = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();
const hash = vi.fn();

vi.mock('@/lib/cache/rate-limit', () => ({
    checkRateLimit,
    getClientIp,
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique,
            create,
        },
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash,
    },
}));

async function loadRoute() {
    vi.resetModules();
    return import('@/app/api/auth/register/route');
}

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getClientIp.mockReturnValue('127.0.0.1');
        checkRateLimit.mockResolvedValue({
            allowed: true,
            remaining: 4,
            limit: 5,
            resetSeconds: 900,
        });
        findUnique.mockResolvedValue(null);
        create.mockResolvedValue({ id: 'user-1' });
        hash.mockResolvedValue('hashed-password');
    });

    it('returns 429 when rate limit is exceeded', async () => {
        checkRateLimit.mockResolvedValue({
            allowed: false,
            remaining: 0,
            limit: 5,
            resetSeconds: 900,
        });

        const { POST } = await loadRoute();
        const response = await POST(new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Alice',
                email: 'Alice@example.com',
                password: 'secret123',
            }),
        }));

        expect(response.status).toBe(429);
        expect(checkRateLimit).toHaveBeenCalledWith('auth:register:127.0.0.1', 5, 900);
        expect(hash).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();

        const body = await response.json();
        expect(body).toMatchObject({
            success: false,
            error: {
                code: 'RATE_LIMITED',
            },
        });
    });

    it('normalizes email before lookup and create', async () => {
        const { POST } = await loadRoute();
        const response = await POST(new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: ' Alice ',
                email: '  Alice@Example.com ',
                password: 'secret123',
            }),
        }));

        expect(response.status).toBe(201);
        expect(findUnique).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
        expect(hash).toHaveBeenCalledWith('secret123', 12);
        expect(create).toHaveBeenCalledWith({
            data: {
                name: 'Alice',
                email: 'alice@example.com',
                passwordHash: 'hashed-password',
            },
        });
    });
});
