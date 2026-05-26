/**
 * enrollment.spec.ts
 *
 * Tests for POST /api/enrollment — the critical security fix for CRÍTICO-2.
 *
 * Verified behaviors:
 *  1. No auth token → 401
 *  2. USUARIO trying to enroll a different email → 403
 *  3. USUARIO, paid course, no paymentId → 403
 *  4. USUARIO, paid course, paymentId not found → 403
 *  5. USUARIO, paid course, paymentId PENDING → 403
 *  6. USUARIO, paid course, paymentId from another user → 403 + IDOR audit
 *  7. USUARIO, paid course, paymentId APPROVED and owned → 201 (enrollment created)
 *  8. ADMIN, no paymentId, any email → 200 (admin override allowed)
 *  9. USUARIO, free course (priceCOP === 0), no paymentId → enrollment created
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  makeRequest, makeAuthRequest,
  firestoreDoc, firestoreQueryResult,
  USER_TOKEN, ADMIN_TOKEN,
  USER_UID, ADMIN_UID,
  PAID_COURSE_SLUG, FREE_COURSE_SLUG,
  APPROVED_TX_ID, PENDING_TX_ID, OTHER_USER_TX_ID, OTHER_USER_UID,
} from './helpers';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: vi.fn(), getUserByEmail: vi.fn() },
  adminDb: { collection: vi.fn() },
}));

vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn() }));
vi.mock('@/lib/automation-engine', () => ({ handleCohortFull: vi.fn().mockResolvedValue(null) }));
vi.mock('@/services/notification.service', () => ({
  NotificationService: { sendEnrollmentConfirmation: vi.fn() },
}));
vi.mock('@/lib/rate-limiter', () => ({
  rateLimiter: { check: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, retryAfterMs: 0 }) },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

// Import after mocks are registered
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { auditLog } from '@/lib/audit-logger';
import { POST } from '@/app/api/enrollment/route';

// ── Firestore mock helpers ────────────────────────────────────────────────────

function setupFirestoreForUser(uid: string, role: string, email: string) {
  const mockUserDoc = firestoreDoc({ uid, role, email, isActive: true, institutionId: '' });
  const mockEmptyQuery = firestoreQueryResult([]);

  const mockCollection = vi.fn().mockImplementation((name: string) => {
    if (name === 'users') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUserDoc),
          update: vi.fn().mockResolvedValue(undefined),
          set: vi.fn().mockResolvedValue(undefined),
        }),
      };
    }
    if (name === 'platform_enrollments') {
      return {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockEmptyQuery) }),
            }),
          }),
        }),
        doc: vi.fn().mockReturnValue({
          set: vi.fn().mockResolvedValue(undefined),
        }),
      };
    }
    if (name === 'course_templates') {
      return {
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(
              firestoreQueryResult([{
                id: 'tpl-rcp',
                slug: PAID_COURSE_SLUG,
                title: 'RCP Básico',
                priceCOP: 350000,
                isFree: false,
              }]),
            ),
          }),
        }),
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(firestoreDoc(null)) }),
      };
    }
    if (name === 'courses') {
      return {
        where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockEmptyQuery) }),
      };
    }
    if (name === 'cohorts') {
      return {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockEmptyQuery) }),
          }),
        }),
      };
    }
    if (name === 'transactions') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(firestoreDoc(null)),
          set: vi.fn().mockResolvedValue(undefined),
        }),
      };
    }
    return { doc: vi.fn(), where: vi.fn(), set: vi.fn() };
  });

  (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation(mockCollection);
}

function setupTransactionMock(txId: string, txData: Record<string, unknown> | null) {
  const mockUserDoc = firestoreDoc({ uid: USER_UID, role: 'USUARIO', email: 'user@test.com', isActive: true });
  const mockEmptyQuery = firestoreQueryResult([]);
  const mockFreeCourseQuery = firestoreQueryResult([{
    id: 'tpl-free',
    slug: FREE_COURSE_SLUG,
    title: 'Primeros Auxilios Gratis',
    priceCOP: 0,
    isFree: true,
  }]);
  const mockPaidCourseQuery = firestoreQueryResult([{
    id: 'tpl-rcp',
    slug: PAID_COURSE_SLUG,
    title: 'RCP Básico',
    priceCOP: 350000,
    isFree: false,
  }]);

  (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
    if (name === 'users') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUserDoc),
          update: vi.fn().mockResolvedValue(undefined),
        }),
      };
    }
    if (name === 'transactions') {
      return {
        doc: vi.fn().mockImplementation((id: string) => ({
          get: vi.fn().mockResolvedValue(
            id === txId ? firestoreDoc(txData) : firestoreDoc(null),
          ),
          set: vi.fn().mockResolvedValue(undefined),
        })),
      };
    }
    if (name === 'course_templates') {
      return {
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              // Return free or paid based on what slug was used (we track by checking calls)
              return Promise.resolve(mockPaidCourseQuery);
            }),
          }),
        }),
      };
    }
    if (name === 'platform_enrollments') {
      return {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockEmptyQuery) }),
            }),
          }),
        }),
        doc: vi.fn().mockReturnValue({ id: 'enroll-test-id', set: vi.fn().mockResolvedValue(undefined) }),
      };
    }
    if (name === 'courses') {
      return { where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockEmptyQuery) }) };
    }
    if (name === 'cohorts') {
      return {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockEmptyQuery) }),
          }),
        }),
      };
    }
    return { doc: vi.fn(), where: vi.fn() };
  });

  // Free course variant helper
  return { mockFreeCourseQuery };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/enrollment', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    (adminAuth.verifyIdToken as ReturnType<typeof vi.fn>)
      .mockImplementation(async (token: string) => {
        if (token === USER_TOKEN) return { uid: USER_UID };
        if (token === ADMIN_TOKEN) return { uid: ADMIN_UID };
        throw new Error('Invalid token');
      });
  });

  // ── 1. No auth ──────────────────────────────────────────────────────────────
  it('returns 401 when no Authorization header is provided', async () => {
    const req = makeRequest('/api/enrollment', {
      method: 'POST',
      body: { email: 'user@test.com', nombre: 'Test', cursoSlug: PAID_COURSE_SLUG },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/no autorizado/i);
  });

  // ── 2. USUARIO trying to enroll a different email ───────────────────────────
  it('returns 403 when USUARIO tries to enroll a different email', async () => {
    // Setup: USER_UID has email user@test.com, but request targets other@test.com
    (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(
              firestoreDoc({ uid: USER_UID, role: 'USUARIO', email: 'user@test.com', isActive: true }),
            ),
          }),
        };
      }
      return { doc: vi.fn(), where: vi.fn() };
    });

    const req = makeAuthRequest('/api/enrollment', USER_TOKEN, {
      method: 'POST',
      body: { email: 'other@test.com', nombre: 'Other', cursoSlug: PAID_COURSE_SLUG },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/solo puedes inscribirte a ti mismo/i);

    // Should audit the email mismatch
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'enrollment_unauthorized_attempt', severity: 'WARN' }),
    );
  });

  // ── 3. USUARIO, paid course, no paymentId ──────────────────────────────────
  it('returns 403 when USUARIO enrolls in paid course without paymentId', async () => {
    setupFirestoreForUser(USER_UID, 'USUARIO', 'user@test.com');

    const req = makeAuthRequest('/api/enrollment', USER_TOKEN, {
      method: 'POST',
      body: {
        email: 'user@test.com',
        nombre: 'Test User',
        cursoSlug: PAID_COURSE_SLUG,
        // No paymentId
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/se requiere un pago aprobado/i);

    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'enrollment_free_bypass_attempt', severity: 'WARN' }),
    );
  });

  // ── 4. USUARIO, paymentId not found in Firestore ────────────────────────────
  it('returns 403 when paymentId does not exist in Firestore', async () => {
    setupTransactionMock('nonexistent-tx', null);

    const req = makeAuthRequest('/api/enrollment', USER_TOKEN, {
      method: 'POST',
      body: {
        email: 'user@test.com',
        nombre: 'Test User',
        cursoSlug: PAID_COURSE_SLUG,
        paymentId: 'nonexistent-tx',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/transacci[oó]n de pago no encontrada/i);
  });

  // ── 5. USUARIO, paymentId with status PENDING ──────────────────────────────
  it('returns 403 when paymentId exists but status is PENDING', async () => {
    setupTransactionMock(PENDING_TX_ID, {
      id: PENDING_TX_ID,
      status: 'PENDING',
      user_id: USER_UID,
      curso_slug: PAID_COURSE_SLUG,
    });

    const req = makeAuthRequest('/api/enrollment', USER_TOKEN, {
      method: 'POST',
      body: {
        email: 'user@test.com',
        nombre: 'Test User',
        cursoSlug: PAID_COURSE_SLUG,
        paymentId: PENDING_TX_ID,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/PENDING/);
    expect(json.error).toMatch(/solo pagos APPROVED/i);
  });

  // ── 6. USUARIO, paymentId belongs to a DIFFERENT user (IDOR) ────────────────
  it('returns 403 and logs CRITICAL audit when paymentId belongs to another user', async () => {
    setupTransactionMock(OTHER_USER_TX_ID, {
      id: OTHER_USER_TX_ID,
      status: 'APPROVED',
      user_id: OTHER_USER_UID,   // ← Different user owns this transaction
      curso_slug: PAID_COURSE_SLUG,
    });

    const req = makeAuthRequest('/api/enrollment', USER_TOKEN, {
      method: 'POST',
      body: {
        email: 'user@test.com',
        nombre: 'Test User',
        cursoSlug: PAID_COURSE_SLUG,
        paymentId: OTHER_USER_TX_ID,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/no pertenece a tu cuenta/i);

    // Must log a CRITICAL audit event for IDOR attempt
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'idor_attempt',
        severity: 'CRITICAL',
        metadata: expect.objectContaining({
          reason: 'transaction_user_mismatch',
          callerUid: USER_UID,
          txUserId: OTHER_USER_UID,
        }),
      }),
    );
  });

  // ── 7. USUARIO, paymentId APPROVED and owned → success ────────────────────
  it('returns 200 when USUARIO provides APPROVED transaction owned by themselves', async () => {
    setupTransactionMock(APPROVED_TX_ID, {
      id: APPROVED_TX_ID,
      status: 'APPROVED',
      user_id: USER_UID,          // ← Same user
      curso_slug: PAID_COURSE_SLUG,
    });

    const req = makeAuthRequest('/api/enrollment', USER_TOKEN, {
      method: 'POST',
      body: {
        email: 'user@test.com',
        nombre: 'Test User',
        cursoSlug: PAID_COURSE_SLUG,
        paymentId: APPROVED_TX_ID,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.enrollmentId).toBeDefined();

    // Should audit as enrollment_created INFO
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'enrollment_created', severity: 'INFO' }),
    );
  });

  // ── 8. ADMIN can enroll anyone without payment ─────────────────────────────
  it('returns 200 when ADMIN enrolls any user without paymentId', async () => {
    // Setup admin user in Firestore
    (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(
              firestoreDoc({ uid: ADMIN_UID, role: 'ADMIN', email: 'admin@test.com', isActive: true }),
            ),
            update: vi.fn().mockResolvedValue(undefined),
          }),
        };
      }
      if (name === 'platform_enrollments') {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  get: vi.fn().mockResolvedValue(firestoreQueryResult([])),
                }),
              }),
            }),
          }),
          doc: vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue(undefined) }),
        };
      }
      if (name === 'course_templates') {
        return {
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(
                firestoreQueryResult([{ id: 'tpl-1', slug: PAID_COURSE_SLUG, title: 'RCP', priceCOP: 350000 }]),
              ),
            }),
          }),
        };
      }
      if (name === 'transactions') {
        return { doc: vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue(undefined) }) };
      }
      if (name === 'courses') {
        return { where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(firestoreQueryResult([])) }) };
      }
      if (name === 'cohorts') {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(firestoreQueryResult([])) }),
            }),
          }),
        };
      }
      // Mock getUserByEmail for admin creating new user
      return { doc: vi.fn(), where: vi.fn() };
    });

    // Mock adminAuth.getUserByEmail to simulate finding existing user
    (adminAuth as unknown as { getUserByEmail: ReturnType<typeof vi.fn> })
      .getUserByEmail = vi.fn().mockResolvedValue({ uid: 'student-uid' });

    const req = makeAuthRequest('/api/enrollment', ADMIN_TOKEN, {
      method: 'POST',
      body: {
        email: 'student@test.com',
        nombre: 'Student Name',
        cursoSlug: PAID_COURSE_SLUG,
        // No paymentId — admin override
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // ── 9. USUARIO, free course (priceCOP = 0), no paymentId → OK ─────────────
  it('allows enrollment without payment for courses with priceCOP = 0', async () => {
    // Override course_templates mock to return a free course
    (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(
              firestoreDoc({ uid: USER_UID, role: 'USUARIO', email: 'user@test.com', isActive: true }),
            ),
            update: vi.fn().mockResolvedValue(undefined),
          }),
        };
      }
      if (name === 'course_templates') {
        return {
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(
                firestoreQueryResult([{
                  id: 'tpl-free',
                  slug: FREE_COURSE_SLUG,
                  title: 'Primeros Auxilios',
                  priceCOP: 0,          // ← Free
                  isFree: true,
                }]),
              ),
            }),
          }),
        };
      }
      if (name === 'platform_enrollments') {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(firestoreQueryResult([])) }),
              }),
            }),
          }),
          doc: vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue(undefined) }),
        };
      }
      if (name === 'courses') {
        return { where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(firestoreQueryResult([])) }) };
      }
      if (name === 'cohorts') {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(firestoreQueryResult([])) }),
            }),
          }),
        };
      }
      return { doc: vi.fn(), where: vi.fn() };
    });

    const req = makeAuthRequest('/api/enrollment', USER_TOKEN, {
      method: 'POST',
      body: {
        email: 'user@test.com',
        nombre: 'Test User',
        cursoSlug: FREE_COURSE_SLUG,
        // No paymentId — free course
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
