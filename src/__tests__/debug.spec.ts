/**
 * debug.spec.ts
 *
 * Tests for /api/debug/* — verifies CRÍTICO-3 is closed.
 *
 * Verified behaviors:
 *  1. In production (NODE_ENV=production) → all debug routes return 404
 *  2. In dev without auth → 401
 *  3. In dev with ADMIN token → 403 (not enough privilege)
 *  4. In dev with SUPER_ADMIN token → 200
 *
 * Tests cover all 4 debug endpoints:
 *  - /api/debug/all-platform
 *  - /api/debug/enrollments
 *  - /api/debug/fix-enrollments
 *  - /api/debug/seed-courses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeRequest, makeAuthRequest, firestoreDoc, firestoreQueryResult, ADMIN_TOKEN, SUPER_ADMIN_TOKEN, ADMIN_UID, SUPER_ADMIN_UID } from './helpers';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: { collection: vi.fn(), batch: vi.fn() },
}));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn() }));
vi.mock('@/data/cursos', () => ({ cursos: [] }));

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { GET as getAllPlatform } from '@/app/api/debug/all-platform/route';
import { GET as getEnrollments } from '@/app/api/debug/enrollments/route';
import { GET as fixEnrollments } from '@/app/api/debug/fix-enrollments/route';
import { GET as seedCourses } from '@/app/api/debug/seed-courses/route';

// ── Setup ─────────────────────────────────────────────────────────────────────

const originalNodeEnv = process.env.NODE_ENV;

function setupAuthMock() {
  (adminAuth.verifyIdToken as ReturnType<typeof vi.fn>)
    .mockImplementation(async (token: string) => {
      if (token === SUPER_ADMIN_TOKEN) return { uid: SUPER_ADMIN_UID };
      if (token === ADMIN_TOKEN) return { uid: ADMIN_UID };
      throw new Error('Invalid token');
    });

  (adminDb.batch as ReturnType<typeof vi.fn>).mockReturnValue({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  });

  (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
    if (name === 'users') {
      return {
        doc: vi.fn().mockImplementation((uid: string) => ({
          get: vi.fn().mockResolvedValue(
            firestoreDoc(
              uid === SUPER_ADMIN_UID
                ? { uid: SUPER_ADMIN_UID, role: 'SUPER_ADMIN', isActive: true, email: 'superadmin@test.com' }
                : uid === ADMIN_UID
                  ? { uid: ADMIN_UID, role: 'ADMIN', isActive: true, email: 'admin@test.com' }
                  : null,
            ),
          ),
        })),
      };
    }
    // Return empty collections for data reads
    return {
      get: vi.fn().mockResolvedValue(firestoreQueryResult([])),
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(firestoreQueryResult([])),
      }),
      batch: vi.fn().mockReturnValue({ set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }),
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(firestoreDoc(null)),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
      }),
    };
  });
}

// ── Production guard tests ────────────────────────────────────────────────────

describe('Debug endpoints in PRODUCTION', () => {
  beforeEach(() => {
    // @ts-expect-error — overriding read-only
    process.env.NODE_ENV = 'production';
    setupAuthMock();
  });

  afterEach(() => {
    // @ts-expect-error
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('GET /api/debug/all-platform → 404 in production', async () => {
    const req = makeAuthRequest('/api/debug/all-platform', SUPER_ADMIN_TOKEN);
    const res = await getAllPlatform(req);
    expect(res.status).toBe(404);
  });

  it('GET /api/debug/enrollments → 404 in production', async () => {
    const req = makeAuthRequest('/api/debug/enrollments', SUPER_ADMIN_TOKEN, {
      searchParams: { userId: 'any-uid' },
    });
    const res = await getEnrollments(req);
    expect(res.status).toBe(404);
  });

  it('GET /api/debug/fix-enrollments → 404 in production', async () => {
    const req = makeAuthRequest('/api/debug/fix-enrollments', SUPER_ADMIN_TOKEN);
    const res = await fixEnrollments(req);
    expect(res.status).toBe(404);
  });

  it('GET /api/debug/seed-courses → 404 in production', async () => {
    const req = makeAuthRequest('/api/debug/seed-courses', SUPER_ADMIN_TOKEN);
    const res = await seedCourses(req);
    expect(res.status).toBe(404);
  });
});

// ── Development guard tests ───────────────────────────────────────────────────

describe('Debug endpoints in DEVELOPMENT', () => {
  beforeEach(() => {
    // @ts-expect-error
    process.env.NODE_ENV = 'test'; // 'test' behaves like dev (not 'production')
    setupAuthMock();
  });

  afterEach(() => {
    // @ts-expect-error
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('GET /api/debug/all-platform', () => {
    it('returns 401 when no auth token is provided', async () => {
      const req = makeRequest('/api/debug/all-platform');
      const res = await getAllPlatform(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 when called with ADMIN token (not SUPER_ADMIN)', async () => {
      const req = makeAuthRequest('/api/debug/all-platform', ADMIN_TOKEN);
      const res = await getAllPlatform(req);
      expect(res.status).toBe(403);
    });

    it('returns 200 when called with SUPER_ADMIN token', async () => {
      const req = makeAuthRequest('/api/debug/all-platform', SUPER_ADMIN_TOKEN);
      const res = await getAllPlatform(req);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/debug/enrollments', () => {
    it('returns 401 without auth', async () => {
      const req = makeRequest('/api/debug/enrollments', { searchParams: { userId: 'x' } });
      const res = await getEnrollments(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 with ADMIN token', async () => {
      const req = makeAuthRequest('/api/debug/enrollments', ADMIN_TOKEN, {
        searchParams: { userId: 'x' },
      });
      const res = await getEnrollments(req);
      expect(res.status).toBe(403);
    });

    it('returns 400 with SUPER_ADMIN but missing userId param', async () => {
      const req = makeAuthRequest('/api/debug/enrollments', SUPER_ADMIN_TOKEN);
      const res = await getEnrollments(req);
      expect(res.status).toBe(400);
    });

    it('returns 200 with SUPER_ADMIN and valid userId param', async () => {
      const req = makeAuthRequest('/api/debug/enrollments', SUPER_ADMIN_TOKEN, {
        searchParams: { userId: 'some-uid' },
      });
      const res = await getEnrollments(req);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/debug/fix-enrollments', () => {
    it('returns 401 without auth', async () => {
      const req = makeRequest('/api/debug/fix-enrollments');
      const res = await fixEnrollments(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 with ADMIN token', async () => {
      const req = makeAuthRequest('/api/debug/fix-enrollments', ADMIN_TOKEN);
      const res = await fixEnrollments(req);
      expect(res.status).toBe(403);
    });

    it('returns 200 with SUPER_ADMIN token', async () => {
      const req = makeAuthRequest('/api/debug/fix-enrollments', SUPER_ADMIN_TOKEN);
      const res = await fixEnrollments(req);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/debug/seed-courses', () => {
    it('returns 401 without auth', async () => {
      const req = makeRequest('/api/debug/seed-courses');
      const res = await seedCourses(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 with ADMIN token', async () => {
      const req = makeAuthRequest('/api/debug/seed-courses', ADMIN_TOKEN);
      const res = await seedCourses(req);
      expect(res.status).toBe(403);
    });

    it('returns 200 with SUPER_ADMIN token (empty cursos)', async () => {
      const req = makeAuthRequest('/api/debug/seed-courses', SUPER_ADMIN_TOKEN);
      const res = await seedCourses(req);
      expect(res.status).toBe(200);
    });
  });
});
