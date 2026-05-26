/**
 * wompi-webhook.spec.ts
 *
 * Tests for POST /api/wompi-webhook — verifies IDOR fix and idempotency.
 *
 * Verified behaviors:
 *  1. Invalid HMAC signature → 401 + CRITICAL audit log
 *  2. Non-transaction.updated event → 200, no side effects
 *  3. APPROVED, user_id missing from transaction → 200 (safe), CRITICAL audit
 *  4. APPROVED, user_id not found in Firestore → 200 (safe), CRITICAL audit
 *  5. APPROVED, valid user, already enrolled (enrolled: true) → 200, idempotent
 *  6. APPROVED, valid user, first time → creates enrollment, marks enrolled: true
 *  7. DECLINED transaction → updates status, no enrollment created
 *  8. Amount out of range → 400, WARN audit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeRequest } from './helpers';
import { USER_UID } from './helpers';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: { collection: vi.fn() },
}));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn() }));
vi.mock('@/lib/automation-engine', () => ({ handleCohortFull: vi.fn().mockResolvedValue(null) }));

import { adminDb } from '@/lib/firebase-admin';
import { auditLog } from '@/lib/audit-logger';
import { POST } from '@/app/api/wompi-webhook/route';

// ── HMAC signature helpers ────────────────────────────────────────────────────

const TEST_EVENTS_SECRET = 'test_events_secret_for_testing';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildValidPayload(txData: {
  id: string;
  reference: string;
  status: string;
  amount_in_cents: number;
  user_id?: string;
  curso_slug?: string;
}): Promise<{
  event: string;
  data: { transaction: Record<string, unknown> };
  timestamp: number;
  environment: string;
  signature: { checksum: string; properties: string[] };
}> {
  const timestamp = Math.floor(Date.now() / 1000);
  const properties = ['data.transaction.id', 'data.transaction.amount_in_cents', 'data.transaction.status'];

  const tx = {
    id: txData.id,
    reference: txData.reference,
    status: txData.status,
    amount_in_cents: txData.amount_in_cents,
    currency: 'COP',
    payment_method_type: 'CARD',
    customer_email: 'test@example.com',
    finalized_at: null,
    error_code: null,
    status_message: null,
  };

  const parts = properties.map(prop => {
    const keys = prop.split('.');
    const payload: Record<string, unknown> = {
      event: 'transaction.updated',
      data: { transaction: tx },
      timestamp,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = payload;
    for (const k of keys) val = val?.[k];
    return String(val ?? '');
  });

  const toSign = [...parts, String(timestamp), TEST_EVENTS_SECRET].join('');
  const checksum = await sha256(toSign);

  return {
    event: 'transaction.updated',
    data: { transaction: tx },
    timestamp,
    environment: 'test',
    signature: { checksum, properties },
  };
}

function makeWebhookRequest(body: unknown): ReturnType<typeof makeRequest> {
  return new (require('next/server').NextRequest)(
    new URL('/api/wompi-webhook', 'http://localhost:3000'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

// ── Firestore mock factory ────────────────────────────────────────────────────

function setupFirestoreMock(opts: {
  txExists?: boolean;
  txData?: Record<string, unknown>;
  userExists?: boolean;
  alreadyEnrolled?: boolean;
}) {
  const {
    txExists = true,
    txData = {},
    userExists = true,
    alreadyEnrolled = false,
  } = opts;

  const mockTxDocData = txExists
    ? { id: 'tx-1', enrolled: alreadyEnrolled, ...txData }
    : null;

  const mockSetMerge = vi.fn().mockResolvedValue(undefined);
  const mockUpdate = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockResolvedValue(undefined);

  let txGetCallCount = 0;

  (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
    if (name === 'transactions') {
      return {
        doc: vi.fn().mockReturnValue({
          set: mockSetMerge,
          update: mockUpdate,
          get: vi.fn().mockImplementation(() => {
            txGetCallCount++;
            return Promise.resolve({
              exists: txExists,
              data: () => mockTxDocData ?? undefined,
            });
          }),
        }),
      };
    }
    if (name === 'users') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: userExists,
            data: () => userExists
              ? { uid: USER_UID, firstName: 'Test', lastName: 'User', email: 'test@example.com' }
              : undefined,
          }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
      };
    }
    if (name === 'platform_enrollments') {
      return {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({
                  empty: !alreadyEnrolled,
                  docs: alreadyEnrolled ? [{ id: 'enroll-1', data: () => ({}) }] : [],
                }),
              }),
            }),
          }),
        }),
        doc: vi.fn().mockReturnValue({ set: mockSet }),
      };
    }
    if (name === 'course_templates') {
      return {
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
          }),
        }),
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ exists: false, data: () => undefined }),
        }),
      };
    }
    if (name === 'cohorts') {
      return {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ empty: true, docs: [] }) }),
          }),
        }),
        doc: vi.fn().mockReturnValue({ update: vi.fn().mockResolvedValue(undefined) }),
      };
    }
    if (name === 'courses') {
      return { where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [] }) }) };
    }
    if (name === 'audit_logs') {
      return { add: vi.fn().mockResolvedValue(undefined) };
    }
    return { doc: vi.fn(), where: vi.fn() };
  });

  return { mockSetMerge, mockUpdate, mockSet };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/wompi-webhook', () => {

  beforeEach(() => {
    process.env.WOMPI_EVENTS_SECRET = TEST_EVENTS_SECRET;
    vi.clearAllMocks();
  });

  // ── 1. Invalid signature ───────────────────────────────────────────────────
  it('returns 401 and logs CRITICAL audit when HMAC signature is invalid', async () => {
    setupFirestoreMock({});

    // Payload is schema-valid but HMAC checksum is wrong → must reach signature check
    const payload = {
      event: 'transaction.updated',
      data: {
        transaction: {
          id: 'tx-1',
          reference: 'ref-bad',
          status: 'APPROVED',
          amount_in_cents: 35000000,
          currency: 'COP',
          payment_method_type: 'CARD',
        },
      },
      timestamp: 9999,
      environment: 'test',
      signature: { checksum: 'invalid-checksum-xxxx-0000000000000000000', properties: ['data.transaction.id'] },
    };

    const req = makeWebhookRequest(payload);
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suspicious_activity', severity: 'CRITICAL' }),
    );
  });

  // ── 2. Non-transaction.updated event ──────────────────────────────────────
  it('returns 200 without side effects for non-transaction.updated events', async () => {
    setupFirestoreMock({});

    const payload = await buildValidPayload({
      id: 'tx-x', reference: 'ref-x', status: 'APPROVED', amount_in_cents: 35000000,
    });
    // Override event type
    const modifiedPayload = { ...payload, event: 'subscription.updated' };

    const req = makeWebhookRequest(modifiedPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    // No transaction update, no enrollment
    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  // ── 3. Amount out of range ─────────────────────────────────────────────────
  it('returns 400 and logs WARN when amount_in_cents is out of range', async () => {
    setupFirestoreMock({});

    const payload = await buildValidPayload({
      id: 'tx-tiny', reference: 'ref-tiny', status: 'APPROVED', amount_in_cents: 1, // < 100 minimum
    });

    const req = makeWebhookRequest(payload);
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suspicious_activity', severity: 'WARN',
        metadata: expect.objectContaining({ reason: 'amount_out_of_range' }) }),
    );
  });

  // ── 4. APPROVED but user_id missing from transaction ──────────────────────
  it('returns 200 safely and logs CRITICAL when transaction has no user_id', async () => {
    setupFirestoreMock({
      txData: {
        // No user_id field
        enrolled: false,
        curso_slug: 'rcp-basico',
      },
    });

    const payload = await buildValidPayload({
      id: 'tx-no-user', reference: 'ref-x', status: 'APPROVED', amount_in_cents: 35000000,
    });

    const req = makeWebhookRequest(payload);
    const res = await POST(req);

    expect(res.status).toBe(200); // Always 200 to Wompi
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'suspicious_activity',
        severity: 'CRITICAL',
        metadata: expect.objectContaining({ reason: 'transaction_missing_user_id' }),
      }),
    );
  });

  // ── 5. APPROVED but user not found in Firestore (IDOR protection) ──────────
  it('returns 200 safely and logs CRITICAL when user_id in transaction does not exist', async () => {
    setupFirestoreMock({
      txData: { user_id: 'nonexistent-uid', enrolled: false, curso_slug: 'rcp-basico' },
      userExists: false, // ← User not in Firestore
    });

    const payload = await buildValidPayload({
      id: 'tx-bad-user', reference: 'ref-x', status: 'APPROVED', amount_in_cents: 35000000,
    });

    const req = makeWebhookRequest(payload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'idor_attempt',
        severity: 'CRITICAL',
        metadata: expect.objectContaining({ reason: 'transaction_user_not_found_in_firestore' }),
      }),
    );
  });

  // ── 6. APPROVED, already enrolled → idempotent ───────────────────────────
  it('returns 200 and does NOT create duplicate enrollment when already enrolled', async () => {
    const { mockSet } = setupFirestoreMock({
      txData: { user_id: USER_UID, enrolled: true, curso_slug: 'rcp-basico' }, // ← already enrolled
      userExists: true,
    });

    const payload = await buildValidPayload({
      id: 'tx-dup', reference: 'ref-dup', status: 'APPROVED', amount_in_cents: 35000000,
    });

    const req = makeWebhookRequest(payload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    // platform_enrollments.doc().set should NOT be called
    expect(mockSet).not.toHaveBeenCalled();
  });

  // ── 7. APPROVED, valid user, first time → creates enrollment ───────────────
  it('creates enrollment and marks enrolled: true for valid APPROVED transaction', async () => {
    const { mockUpdate } = setupFirestoreMock({
      txData: { user_id: USER_UID, enrolled: false, curso_slug: 'rcp-basico' },
      userExists: true,
      alreadyEnrolled: false,
    });

    const payload = await buildValidPayload({
      id: 'tx-valid', reference: 'ref-valid', status: 'APPROVED', amount_in_cents: 35000000,
    });

    const req = makeWebhookRequest(payload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Should update enrolled: true
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ enrolled: true }),
    );
    // Should log enrollment_created
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'enrollment_created', severity: 'INFO' }),
    );
  });

  // ── 8. DECLINED → updates status, no enrollment ───────────────────────────
  it('updates transaction status to DECLINED without creating enrollment', async () => {
    const { mockSetMerge, mockSet } = setupFirestoreMock({
      txData: { user_id: USER_UID, enrolled: false },
    });

    const payload = await buildValidPayload({
      id: 'tx-declined', reference: 'ref-dec', status: 'DECLINED', amount_in_cents: 35000000,
    });

    const req = makeWebhookRequest(payload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Status should be updated in Firestore
    expect(mockSetMerge).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DECLINED', wompiStatus: 'DECLINED' }),
      { merge: true },
    );
    // No enrollment created
    expect(mockSet).not.toHaveBeenCalled();
  });
});
