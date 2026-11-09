/**
 * Entrega de maniquíes, licencias SST y packs tras un pago aprobado por Wompi.
 * La orden, el beneficio y la marca `enrolled` van en un mismo lote: un reintento
 * del webhook nunca entrega dos veces ni deja una compra a medias.
 */
import admin from 'firebase-admin';
import type { DocumentReference, DocumentData } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { packCertificates } from '@/lib/product-pricing';

export const PRODUCT_PURCHASE_TYPES = ['manikin_purchase', 'sst_license', 'pack_purchase'];

const LICENSE_DAYS = 30;

export interface FulfillmentResult {
  productName: string;
  expiresAt?: Date;
  note: string;
}

/** Una renovación anticipada suma sus días a los que aún quedan. */
function licenseExpiry(current: unknown): Date {
  const stored = current as FirebaseFirestore.Timestamp | undefined;
  const now = Date.now();
  const start = stored?.toMillis && stored.toMillis() > now ? stored.toMillis() : now;
  return new Date(start + LICENSE_DAYS * 24 * 60 * 60 * 1000);
}

export async function fulfillProductPurchase(
  metaRef: DocumentReference<DocumentData>,
  tx: FirebaseFirestore.DocumentData,
  userId: string,
  wompi: { id: string; amount_in_cents: number; payment_method_type: string },
): Promise<FulfillmentResult> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const userRef = adminDb.collection('users').doc(userId);
  const totalCOP = wompi.amount_in_cents / 100;

  const order: Record<string, unknown> = {
    orderId: metaRef.id,
    userId,
    userEmail: tx.userEmail ?? '',
    paymentProvider: 'wompi',
    wompiTransactionId: wompi.id,
    payMethod: wompi.payment_method_type,
    totalCOP,
    total: totalCOP,
    status: 'paid',
    paidAt: now,
    createdAt: now,
  };

  const batch = adminDb.batch();
  const orderRef = adminDb.collection('orders').doc(`wompi_${metaRef.id}`);
  let result: FulfillmentResult;

  if (tx.type === 'manikin_purchase') {
    Object.assign(order, {
      type: 'manikin',
      packSlug: tx.packSlug,
      packName: tx.productName,
      quantity: tx.quantity ?? 1,
      buyerType: tx.buyerType ?? 'persona',
      buyer: tx.buyer ?? null,
      buyerEmail: tx.userEmail ?? '',
      shipping: tx.shippingAddress ?? null,
      shippingStatus: 'pending',
    });
    result = {
      productName: tx.productName,
      note: 'Preparamos tu pedido y te avisaremos cuando salga hacia la dirección de envío.',
    };
  } else if (tx.type === 'sst_license') {
    const buyer = (await userRef.get()).data() ?? {};
    const expiresAt = licenseExpiry(buyer.sstSubscription?.expiresAt);
    const expires = admin.firestore.Timestamp.fromDate(expiresAt);
    Object.assign(order, { type: 'licencia-sst', planSlug: tx.planSlug, planName: tx.productName });
    // No toca sstLicenseVerified: pagar no equivale a verificar la licencia profesional.
    batch.set(userRef, {
      sstSubscription: { plan: tx.planSlug, status: 'active', expiresAt: expires, lastPaymentCents: wompi.amount_in_cents },
      updatedAt: now,
    }, { merge: true });
    result = {
      productName: tx.productName,
      expiresAt,
      note: 'Este pago cubre 30 días y no se renueva solo.',
    };
  } else if (tx.type === 'pack_purchase') {
    const certificates = packCertificates(tx.packSlug);
    if (!certificates) throw new Error(`Pack desconocido: ${tx.packSlug}`);
    Object.assign(order, { type: 'pack-sst', packSlug: tx.packSlug, packName: tx.productName, certificates });
    batch.set(userRef, {
      certificateCredits: admin.firestore.FieldValue.increment(certificates),
      updatedAt: now,
    }, { merge: true });
    result = {
      productName: tx.productName,
      note: `Sumamos ${certificates} certificados a tu cuenta.`,
    };
  } else {
    throw new Error(`Tipo de compra no soportado: ${tx.type}`);
  }

  batch.set(orderRef, order);
  batch.update(metaRef, { enrolled: true, enrolled_at: now });
  await batch.commit();
  return result;
}
