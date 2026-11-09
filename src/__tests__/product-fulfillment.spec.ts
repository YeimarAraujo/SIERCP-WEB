import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase-admin', () => ({ adminDb: { collection: vi.fn(), batch: vi.fn() } }));

import { adminDb } from '@/lib/firebase-admin';
import { fulfillProductPurchase } from '@/lib/product-fulfillment';
import { packCertificates, quoteManikin, quoteSstLicense, quoteSstPack } from '@/lib/product-pricing';

const wompi = { id: 'tx-1', amount_in_cents: 5_355_000, payment_method_type: 'CARD' };
const metaRef = { id: 'link-1' } as never;

function mockDb(user: Record<string, unknown> = {}) {
  const batch = { set: vi.fn(), update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
  (adminDb.batch as ReturnType<typeof vi.fn>).mockReturnValue(batch);
  (adminDb.collection as ReturnType<typeof vi.fn>).mockImplementation((name: string) => ({
    doc: (id: string) => ({ name, id, get: async () => ({ data: () => user }) }),
  }));
  return batch;
}

const setOn = (batch: ReturnType<typeof mockDb>, name: string) =>
  batch.set.mock.calls.find(([ref]) => (ref as { name: string }).name === name)?.[1];

describe('precios de productos', () => {
  it('cobra lo mismo que muestra la página, con IVA', () => {
    expect(quoteManikin('unidad')?.totalCOP).toBe(2_320_500);
    expect(quoteSstLicense('sst-basico')?.totalCOP).toBe(178_500);
    expect(quoteSstPack('pack-5')?.amountCents).toBe(5_355_000);
  });

  it('rechaza productos desconocidos o por cotización', () => {
    expect(quoteManikin('pack-12')).toBeNull();
    expect(quoteSstPack('pack-999')).toBeNull();
  });

  it('lee los certificados del pack', () => {
    expect(packCertificates('pack-15')).toBe(15);
  });
});

describe('entrega tras el pago', () => {
  beforeEach(() => vi.clearAllMocks());

  it('un pedido de maniquí queda pagado y pendiente de envío', async () => {
    const batch = mockDb();

    await fulfillProductPurchase(metaRef, {
      type: 'manikin_purchase', packSlug: 'unidad', productName: 'Maniquí', shippingAddress: { city: 'Cali' },
    }, 'u1', wompi);

    expect(setOn(batch, 'orders')).toMatchObject({
      type: 'manikin', status: 'paid', shippingStatus: 'pending', total: 53_550, shipping: { city: 'Cali' },
    });
    expect(batch.update).toHaveBeenCalledWith(metaRef, expect.objectContaining({ enrolled: true }));
    expect(batch.commit).toHaveBeenCalledOnce();
  });

  it('la licencia activa 30 días sin marcar la licencia como verificada', async () => {
    const batch = mockDb();

    const result = await fulfillProductPurchase(metaRef, {
      type: 'sst_license', planSlug: 'sst-pro', productName: 'SST Pro',
    }, 'u1', wompi);

    const user = setOn(batch, 'users') as Record<string, any>;
    expect(user.sstSubscription).toMatchObject({ plan: 'sst-pro', status: 'active' });
    expect(user).not.toHaveProperty('sstLicenseVerified');
    const days = ((result.expiresAt as Date).getTime() - Date.now()) / 86_400_000;
    expect(Math.round(days)).toBe(30);
  });

  it('renovar antes de vencer conserva los días restantes', async () => {
    const remaining = Date.now() + 10 * 86_400_000;
    mockDb({ sstSubscription: { expiresAt: { toMillis: () => remaining } } });

    const result = await fulfillProductPurchase(metaRef, {
      type: 'sst_license', planSlug: 'sst-pro', productName: 'SST Pro',
    }, 'u1', wompi);

    const days = ((result.expiresAt as Date).getTime() - Date.now()) / 86_400_000;
    expect(Math.round(days)).toBe(40);
  });

  it('el pack abona certificados en el mismo lote que la orden', async () => {
    const batch = mockDb();

    await fulfillProductPurchase(metaRef, {
      type: 'pack_purchase', packSlug: 'pack-15', productName: 'Pack 15',
    }, 'u1', wompi);

    expect(setOn(batch, 'users')).toHaveProperty('certificateCredits');
    expect(setOn(batch, 'orders')).toMatchObject({ type: 'pack-sst', certificates: 15 });
    expect(batch.commit).toHaveBeenCalledOnce();
  });

  it('no confirma nada si el lote falla', async () => {
    const batch = mockDb();
    batch.commit.mockRejectedValue(new Error('firestore caído'));

    await expect(fulfillProductPurchase(metaRef, {
      type: 'pack_purchase', packSlug: 'pack-5', productName: 'Pack 5',
    }, 'u1', wompi)).rejects.toThrow();
  });
});
