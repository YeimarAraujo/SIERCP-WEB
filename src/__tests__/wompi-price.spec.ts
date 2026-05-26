/**
 * wompi-price.spec.ts
 *
 * Tests for POST /api/wompi — verifies server-side price resolution (IDOR fix).
 *
 * Verified behaviors:
 *  1. No auth → 401
 *  2. Missing required fields → 400
 *  3. Course not found in Firestore → 422
 *  4. Already APPROVED transaction for same user+course → 409
 *  5. Wompi API error → propagates error status
 *  6. Successful payment via slug lookup → 200, server-resolved price in response
 *  7. Cohort price takes priority over slug/template price
 *  8. Client-supplied amount_in_cents is always IGNORED
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeRequest, makeAuthRequest, USER_UID, USER_TOKEN } from './helpers';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: { collection: vi.fn() },
}));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn() }));
vi.mock('@/lib/rate-limiter', () => ({
  rateLimiter: { check: vi.fn().mockReturnValue({ allowed: true, retryAfterMs: 0 }) },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));
vi.mock('@/lib/idempotency', () => ({
  getIdempotencyKey: vi.fn().mockReturnValue(null),
  checkIdempotency: vi.fn().mockResolvedValue(null),
  markIdempotencyProcessing: vi.fn().mockResolvedValue(undefined),
  storeIdempotencyResult: vi.fn().mockResolvedValue(undefined),
}));

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { POST } from '@/app/api/wompi/route';

// ── Base request body ─────────────────────────────────────────────────────────

const VALID_BODY = {
  customer_email: 'test@example.com',
  acceptance_token: 'tok_test_abc123',
  payment_method: { type: 'CARD', token: 'card_tok_test' },
  customer_data: {
    phone_number: '3001234567',
    full_name: 'Test User',
    legal_id: '12345678',
    legal_id_type: 'CC',
  },
  curso_slug: 'rcp-basico',
};

// ── Firestore + auth mock factory ──────────────────────────────────────────────

function setupMocks(opts: {
  cohortExists?: boolean;
  cohortPriceCOP?: number;
  cohortId?: string;
  slugTemplateExists?: boolean;
  slugTemplatePriceCOP?: number;
  existingApprovedTx?: boolean;
}) {
  const {
    cohortExists = false,
    cohortPriceCOP = 0,
    cohortId = 'cohort-1',
    slugTemplateExists = true,
    slugTemplatePriceCOP = 350000, // 350,000 COP = 35,000,000 cents
    existingApprovedTx = false,
  } = opts;

  (adminAuth.verifyIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: USER_UID });

  const mockTxSet = vi.fn().mockResolvedValue(undefined);

  (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
    if (name === 'cohorts') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: cohortExists,
            data: () =>
              cohortExists
                ? { priceCOP: cohortPriceCOP, courseTitle: 'RCP Básico Cohorte', templateId: 'tmpl-1' }
                : undefined,
          }),
        }),
      };
    }

    if (name === 'course_templates') {
      return {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ exists: false, data: () => undefined }),
        }),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              empty: !slugTemplateExists,
              docs: slugTemplateExists
                ? [{ id: 'tmpl-slug', data: () => ({ priceCOP: slugTemplatePriceCOP, title: 'RCP Básico' }) }]
                : [],
            }),
          }),
        }),
      };
    }

    if (name === 'transactions') {
      return {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  get: vi.fn().mockResolvedValue({
                    empty: !existingApprovedTx,
                    docs: existingApprovedTx ? [{ id: 'existing-tx' }] : [],
                  }),
                }),
              }),
            }),
          }),
        }),
        doc: vi.fn().mockReturnValue({ set: mockTxSet }),
      };
    }

    if (name === 'audit_logs') {
      return { add: vi.fn().mockResolvedValue(undefined) };
    }

    return { doc: vi.fn(), where: vi.fn() };
  });

  return { mockTxSet };
}

// ── Wompi API fetch helpers ───────────────────────────────────────────────────

function mockWompiSuccess() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: { id: 'wompi-tx-123', status: 'PENDING', redirect_url: null },
        }),
    }),
  );
}

function mockWompiError(status = 422) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ error: { reason: 'invalid_card' } }),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/wompi', () => {
  beforeEach(() => {
    process.env.WOMPI_PRIVATE_KEY = 'test_private_key';
    process.env.WOMPI_INTEGRITY_KEY = 'test_integrity_key';
    process.env.WOMPI_ENV = 'sandbox';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  // ── 1. No auth ─────────────────────────────────────────────────────────────
  it('returns 401 when no Authorization header is provided', async () => {
    const req = makeRequest('/api/wompi', { method: 'POST', body: VALID_BODY });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // ── 2. Invalid body ────────────────────────────────────────────────────────
  it('returns 400 when required fields are missing', async () => {
    setupMocks({});
    const req = makeAuthRequest('/api/wompi', USER_TOKEN, {
      method: 'POST',
      body: { customer_email: 'test@example.com' }, // missing acceptance_token, payment_method, etc.
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ── 3. Course not found ────────────────────────────────────────────────────
  it('returns 422 when course cannot be found in Firestore', async () => {
    setupMocks({ slugTemplateExists: false }); // No cohort, no slug match
    const req = makeAuthRequest('/api/wompi', USER_TOKEN, {
      method: 'POST',
      body: VALID_BODY,
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  // ── 4. Already approved → 409 ─────────────────────────────────────────────
  it('returns 409 when user already has an APPROVED transaction for the same course', async () => {
    setupMocks({ existingApprovedTx: true });
    const req = makeAuthRequest('/api/wompi', USER_TOKEN, {
      method: 'POST',
      body: VALID_BODY,
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  // ── 5. Wompi API error ─────────────────────────────────────────────────────
  it('returns Wompi error status when the Wompi API call fails', async () => {
    setupMocks({});
    mockWompiError(422);
    const req = makeAuthRequest('/api/wompi', USER_TOKEN, {
      method: 'POST',
      body: VALID_BODY,
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  // ── 6. Successful payment — slug-resolved price ────────────────────────────
  it('returns 200 with server-resolved price from slug lookup', async () => {
    setupMocks({ slugTemplatePriceCOP: 350000 });
    mockWompiSuccess();

    const req = makeAuthRequest('/api/wompi', USER_TOKEN, {
      method: 'POST',
      body: VALID_BODY,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    // 350,000 COP * 100 = 35,000,000 cents
    expect(json.amount_in_cents).toBe(35_000_000);
    expect(json.transaction_id).toBe('wompi-tx-123');
  });

  // ── 7. Cohort price takes priority ────────────────────────────────────────
  it('uses cohort priceCOP when cohortId is provided, ignoring slug/template price', async () => {
    setupMocks({
      cohortExists: true,
      cohortPriceCOP: 500000, // 500,000 COP → 50,000,000 cents
      slugTemplatePriceCOP: 350000, // would be 35,000,000 — should NOT be used
    });
    mockWompiSuccess();

    const req = makeAuthRequest('/api/wompi', USER_TOKEN, {
      method: 'POST',
      body: { ...VALID_BODY, cohort_id: 'cohort-1' },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    // Must use cohort price, not slug price
    expect(json.amount_in_cents).toBe(50_000_000);
    expect(json.amount_in_cents).not.toBe(35_000_000);

    // Verify fetch was called with cohort price
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const calledBody = JSON.parse(fetchCall[1].body as string);
    expect(calledBody.amount_in_cents).toBe(50_000_000);
  });

  // ── 8. Client amount_in_cents is always ignored ───────────────────────────
  it('ignores any amount_in_cents sent by the client — always uses server-resolved price', async () => {
    const { mockTxSet } = setupMocks({ slugTemplatePriceCOP: 350000 });
    mockWompiSuccess();

    const req = makeAuthRequest('/api/wompi', USER_TOKEN, {
      method: 'POST',
      body: {
        ...VALID_BODY,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        amount_in_cents: 1 as any, // Attacker tries to pay 1 cent
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();

    // Server must return 35,000,000 (server-resolved), NOT 1 (client-supplied)
    expect(json.amount_in_cents).toBe(35_000_000);
    expect(json.amount_in_cents).not.toBe(1);

    // Wompi was called with server price
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const calledBody = JSON.parse(fetchCall[1].body as string);
    expect(calledBody.amount_in_cents).toBe(35_000_000);
    expect(calledBody.amount_in_cents).not.toBe(1);

    // Firestore transaction stored server price and user_id from JWT (not client)
    expect(mockTxSet).toHaveBeenCalledWith(
      expect.objectContaining({ amount_in_cents: 35_000_000, user_id: USER_UID }),
    );
  });
});
