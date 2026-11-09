/**
 * Inicio de compra compartido por maniquíes, licencia SST y packs: autentica al
 * comprador, crea el enlace de Wompi y guarda la compra como PENDING. La entrega
 * ocurre solo en el webhook firmado (lib/product-fulfillment).
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { auditLog } from '@/lib/audit-logger';
import { appBaseUrl, createWompiPaymentLink } from '@/lib/wompi-link';
import type { ProductQuote } from '@/lib/product-pricing';

export interface CheckoutBuyer {
  uid: string;
  email: string;
  ip: string;
}

export interface BuyerProfile {
  firstName?: string;
  lastName?: string;
  documentType?: string;
  identification?: string;
  phoneNumber?: string;
}

/** Devuelve el comprador, o la respuesta de error que debe enviar la ruta. */
export async function authenticateBuyer(req: NextRequest, rateKey: string): Promise<CheckoutBuyer | NextResponse> {
  const ip = getClientIp(req);

  const authz = req.headers.get('authorization') ?? '';
  if (!authz.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Debes iniciar sesión para continuar.' }, { status: 401 });
  }

  let uid: string;
  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authz.slice(7));
    uid = decoded.uid;
    email = (decoded.email ?? '').toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' }, { status: 401 });
  }

  const rl = await rateLimiter.check(`${rateKey}:${ip}`, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  return { uid, email, ip };
}

/** El webhook exige que el comprador exista: sin perfil el pago no se entregaría. */
async function ensureBuyerProfile(buyer: CheckoutBuyer, profile: BuyerProfile) {
  const userRef = adminDb.collection('users').doc(buyer.uid);
  if ((await userRef.get()).exists) return;
  await userRef.set({
    uid: buyer.uid,
    email: buyer.email,
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    documentType: profile.documentType ?? '',
    identification: profile.identification ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    role: 'USUARIO',
    isActive: true,
    certVerification: 'NONE',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function startProductCheckout(req: NextRequest, opts: {
  buyer: CheckoutBuyer;
  quote: ProductQuote;
  /** Tipo de la transacción, usado por el webhook para entregar. */
  type: 'manikin_purchase' | 'sst_license' | 'pack_purchase';
  /** Segmento de la ruta /checkout/<returnType> y texto de la confirmación. */
  returnType: 'manikin' | 'licencia-sst' | 'pack';
  description: string;
  profile: BuyerProfile;
  metadata: Record<string, unknown>;
}): Promise<NextResponse> {
  const { buyer, quote, type, returnType, description, profile, metadata } = opts;

  let link: { id: string; url: string };
  try {
    link = await createWompiPaymentLink({
      name: quote.name,
      description,
      amountCents: quote.amountCents,
      redirectUrl: `${appBaseUrl(req.nextUrl.origin)}/pago/plan/confirmacion?type=${returnType}`,
    });
  } catch (err) {
    console.error(`[checkout/${returnType}]`, err);
    return NextResponse.json({ error: 'No se pudo conectar con la pasarela de pago.' }, { status: 502 });
  }

  await ensureBuyerProfile(buyer, profile);

  await adminDb.collection('transactions').doc(link.id).set({
    ...metadata,
    id: link.id,
    type,
    productName: quote.name,
    user_id: buyer.uid,
    userEmail: buyer.email,
    subtotalCOP: quote.subtotalCOP,
    amount_in_cents: quote.amountCents,
    currency: 'COP',
    status: 'PENDING',
    enrolled: false,
    wompiCheckoutUrl: link.url,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ip: buyer.ip,
  });

  await auditLog({
    type: 'payment_attempt',
    severity: 'INFO',
    ip: buyer.ip,
    userId: buyer.uid,
    metadata: { productType: type, slug: quote.slug, amountCents: quote.amountCents, paymentLinkId: link.id },
  });

  return NextResponse.json({ redirectUrl: link.url, sessionId: link.id, amountCents: quote.amountCents });
}
