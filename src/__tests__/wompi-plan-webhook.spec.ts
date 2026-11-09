/**
 * Compra de planes en POST /api/wompi-webhook: firma con el formato oficial de
 * Wompi y activación de la institución solo con un pago aprobado y exacto.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeRequest } from './helpers';

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: { collection: vi.fn(), batch: vi.fn(), doc: vi.fn() },
}));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn() }));
vi.mock('@/lib/plan-enforcement', () => ({ reactivateInstitution: vi.fn() }));
vi.mock('@/services/notification.service', () => ({
  NotificationService: {
    sendInstitutionWelcome: vi.fn().mockResolvedValue(undefined),
    sendPlanReceipt: vi.fn().mockResolvedValue(undefined),
    sendPaymentReceipt: vi.fn().mockResolvedValue(undefined),
    sendProductReceipt: vi.fn().mockResolvedValue(undefined),
  },
}));

import { adminDb } from '@/lib/firebase-admin';
import { auditLog } from '@/lib/audit-logger';
import { NotificationService } from '@/services/notification.service';
import { POST } from '@/app/api/wompi-webhook/route';

const SECRET = 'test_events_secret';
const AMOUNT = 542_640_000;

function request(body: unknown) {
  return makeRequest('http://localhost/api/wompi-webhook', { method: 'POST', body });
}

function approvedEvent(amount = AMOUNT, overrides: Record<string, unknown> = {}) {
  const transaction = {
    id: 'tx-1',
    reference: 'auto-generada-por-wompi',
    payment_link_id: 'link-1',
    status: 'APPROVED',
    amount_in_cents: amount,
    currency: 'COP',
    payment_method_type: 'CARD',
    customer_email: 'admin@empresa.co',
    ...overrides,
  };
  const timestamp = 1_700_000_000;
  const raw = `${transaction.id}${transaction.status}${amount}${timestamp}${SECRET}`;
  return {
    event: 'transaction.updated',
    data: { transaction },
    environment: 'prod',
    timestamp,
    signature: {
      properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
      checksum: createHash('sha256').update(raw).digest('hex').toUpperCase(),
    },
  };
}

function mockFirestore(meta: Record<string, unknown>, commit = vi.fn().mockResolvedValue(undefined)) {
  const batchSet = vi.fn();
  (adminDb.batch as ReturnType<typeof vi.fn>).mockReturnValue({ set: batchSet, update: vi.fn(), commit });

  const docFor = (id: string) => ({
    id,
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    collection: () => ({ doc: docFor }),
    get: vi.fn().mockResolvedValue(
      id === 'link-1'
        ? { exists: true, data: () => meta }
        : { exists: true, data: () => (id === 'buyer-1' ? { role: 'USUARIO' } : {}) },
    ),
  });

  (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => ({ doc: vi.fn(docFor) }));
  return { batchSet, commit };
}

const META = {
  type: 'new_institution_plan',
  planType: 'pyme',
  planName: 'PYME',
  user_id: 'buyer-1',
  institutionName: 'Empresa Demo',
  institutionNit: '900123456',
  adminEmail: 'admin@empresa.co',
  amount_in_cents: AMOUNT,
  enrolled: false,
};

describe('webhook de Wompi: compra de planes', () => {
  beforeEach(() => {
    process.env.WOMPI_EVENTS_SECRET = SECRET;
    vi.clearAllMocks();
  });

  it('firma la misma cadena del ejemplo oficial de Wompi, en mayúsculas', async () => {
    process.env.WOMPI_EVENTS_SECRET = 'prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z';
    mockFirestore({});
    const res = await POST(request({
      event: 'otro.evento',
      data: {
        transaction: {
          id: '1234-1610641025-49201',
          reference: 'MZQ3X2DE2SMX',
          status: 'APPROVED',
          amount_in_cents: 4490000,
          currency: 'COP',
          payment_method_type: 'NEQUI',
          customer_email: 'juan.perez@gmail.com',
        },
      },
      environment: 'prod',
      timestamp: 1530291411,
      signature: {
        properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
        // SHA-256 de la cadena de la guía; el checksum impreso allí es ilustrativo.
        checksum: '5A18EC5E8FDB7DF463E9F94774CBA8F583BA21BD04A09CEFF2EA68A4BC0AEFBE',
      },
    }));
    expect(res.status).toBe(200);
  });

  it('crea institución y administrador al aprobarse, usando payment_link_id', async () => {
    const { batchSet, commit } = mockFirestore(META);

    const res = await POST(request(approvedEvent()));

    expect(res.status).toBe(200);
    expect(commit).toHaveBeenCalledOnce();
    expect(batchSet).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'buyer-1' }),
      expect.objectContaining({ role: 'ADMIN', institutionId: 'inst_link-1' }),
      { merge: true },
    );
    expect(batchSet).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'current' }),
      expect.objectContaining({ planType: 'pyme', isActive: true }),
      { merge: true },
    );
    expect(NotificationService.sendInstitutionWelcome).toHaveBeenCalledOnce();
  });

  it('no activa nada si el monto pagado no coincide', async () => {
    const { commit } = mockFirestore(META);

    const res = await POST(request(approvedEvent(100_000)));

    expect(res.status).toBe(200);
    expect(commit).not.toHaveBeenCalled();
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'CRITICAL',
      metadata: expect.objectContaining({ reason: 'plan_amount_mismatch' }),
    }));
  });

  it('no activa nada si el pago fue rechazado', async () => {
    const { commit } = mockFirestore(META);

    const res = await POST(request(approvedEvent(AMOUNT, { status: 'DECLINED' })));

    expect(res.status).toBe(200);
    expect(commit).not.toHaveBeenCalled();
  });

  it('entrega un pack aprobado y envía el comprobante', async () => {
    const { commit } = mockFirestore({
      type: 'pack_purchase', packSlug: 'pack-5', productName: 'Pack 5', user_id: 'buyer-1', amount_in_cents: AMOUNT, enrolled: false,
    });

    const res = await POST(request(approvedEvent()));

    expect(res.status).toBe(200);
    expect(commit).toHaveBeenCalledOnce();
    expect(NotificationService.sendProductReceipt).toHaveBeenCalledOnce();
  });

  it('no entrega un pack si el monto no coincide', async () => {
    const { commit } = mockFirestore({
      type: 'pack_purchase', packSlug: 'pack-5', user_id: 'buyer-1', amount_in_cents: AMOUNT, enrolled: false,
    });

    await POST(request(approvedEvent(100_000)));

    expect(commit).not.toHaveBeenCalled();
  });

  it('pide reintento a Wompi si la activación falla', async () => {
    mockFirestore(META, vi.fn().mockRejectedValue(new Error('firestore caído')));

    const res = await POST(request(approvedEvent()));

    expect(res.status).toBe(500);
  });

  it('no repite la activación en un reintento', async () => {
    const { commit } = mockFirestore({ ...META, enrolled: true });

    const res = await POST(request(approvedEvent()));

    expect(res.status).toBe(200);
    expect(commit).not.toHaveBeenCalled();
  });
});
