/**
 * E2E Smoke Tests
 *
 * These tests verify critical user journeys against a running app.
 * They can be run with a test Supabase instance and pre-seeded data.
 *
 * Run: npm run test:e2e
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('E2E Smoke Tests', () => {
    describe('Authentication', () => {
        it('login page should be accessible', async () => {
            const res = await fetch(`${APP_URL}/login`);
            expect(res.status).toBe(200);
        });

        it('dashboard should redirect to login for unauthenticated users', async () => {
            const res = await fetch(`${APP_URL}/dashboard`, { redirect: 'manual' });
            expect([301, 302, 303, 307, 308]).toContain(res.status);
        });
    });

    describe('API Routes', () => {
        it('POST /api/workspaces should return 401 without auth', async () => {
            const res = await fetch(`${APP_URL}/api/workspaces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test' }),
            });
            expect(res.status).toBe(401);
        });

        it('GET /api/notifications should return 401 without auth', async () => {
            const res = await fetch(`${APP_URL}/api/notifications`);
            expect(res.status).toBe(401);
        });
    });
});
