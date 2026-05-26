/**
 * POST /api/checkout/pack
 *
 * Crea un payment link de Wompi para adquirir un pack único de certificados SST
 * (sin licencia). Requiere autenticación. No genera suscripción ni cargo recurrente.
 *
 * SEGURIDAD:
 *  - Requiere Firebase ID token válido.
 *  - Precio resuelto en el servidor (nunca del cliente).
 *  - El pack se activa SOLO con webhook firmado de Wompi (APPROVED).
 *  - Rate-limited: 3 req/min por IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { auditLog } from '@/lib/audit-logger';
import { PackCheckoutRequestSchema, parseBody } from '@/lib/schemas';

// Precios server-side (COP centavos) — pago único
const PACK_PRICES_CENTS: Record<string, number> = {
  'pack-5':  4_500_000,  // $45.000 COP
  'pack-15': 12_000_000, // $120.000 COP
  'pack-40': 28_000_000, // $280.000 COP
};

const PACK_LABELS: Record<string, string> = {
  'pack-5':  'Pack 5 certificados SST',
  'pack-15': 'Pack 15 certificados SST',
  'pack-40': 'Pack 40 certificados SST',
};

const MAX_DISCOUNT_PERCENT = 30;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Auth required
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Autenticación requerida.' }, { status: 401 });
  }

  let userId: string;
  let userEmail: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    userId = decoded.uid;
    userEmail = decoded.email ?? '';
  } catch {
    return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
  }

  const rl = await rateLimiter.check(`checkout-pack:${ip}`, { max: 3, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const parsed = await parseBody(req, PackCheckoutRequestSchema);
  if (parsed.error) return parsed.error;

  const { packSlug, discountCode, discountCents: clientDiscountCents } = parsed.data;

  const baseAmountCents = PACK_PRICES_CENTS[packSlug];
  if (!baseAmountCents) {
    return NextResponse.json({ error: 'Pack no válido.' }, { status: 400 });
  }

  // Validate & cap discount
  let resolvedDiscountCents = 0;
  if (discountCode && clientDiscountCents && clientDiscountCents > 0) {
    const snap = await adminDb.collection('discount_codes').doc(discountCode).get();
    if (snap.exists && snap.data()!.active) {
      const maxDiscount = Math.round((baseAmountCents * MAX_DISCOUNT_PERCENT) / 100);
      resolvedDiscountCents = Math.min(clientDiscountCents, maxDiscount, baseAmountCents - 1);
    }
  }

  const amountCents = baseAmountCents - resolvedDiscountCents;

  const wompiKey = process.env.WOMPI_PRIVATE_KEY;
  const wompiEnv = process.env.WOMPI_ENV;
  const wompiApiBase = wompiEnv === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com';

  if (!wompiKey) {
    return NextResponse.json({ error: 'Pasarela de pago no disponible.' }, { status: 503 });
  }

  let wompiPaymentLinkId: string;
  let wompiCheckoutUrl: string;

  try {
    const wompiRes = await fetch(`${wompiApiBase}/payment_links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wompiKey}` },
      body: JSON.stringify({
        name: PACK_LABELS[packSlug] ?? `Pack ${packSlug}`,
        description: `${PACK_LABELS[packSlug] ?? packSlug} para ${userEmail} — pago único`,
        single_use: true,
        collect_shipping: false,
        currency: 'COP',
        amount_in_cents: amountCents,
        redirect_url: `${appUrl}/checkout/resultado?tipo=pack`,
      }),
    });

    if (!wompiRes.ok) {
      const errText = await wompiRes.text();
      console.error('[checkout/pack] Wompi error:', wompiRes.status, errText);
      return NextResponse.json({ error: 'No se pudo crear el enlace de pago.' }, { status: 502 });
    }

    const wompiData = await wompiRes.json() as {
      data: { id: string; url?: string; payment_link?: { url: string } };
    };
    wompiPaymentLinkId = wompiData.data.id;
    wompiCheckoutUrl = wompiData.data.url ?? wompiData.data.payment_link?.url ?? `https://checkout.wompi.co/l/${wompiPaymentLinkId}`;
  } catch (err) {
    console.error('[checkout/pack] fetch error:', err);
    return NextResponse.json({ error: 'Error de conexión con la pasarela.' }, { status: 502 });
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await adminDb.collection('transactions').doc(wompiPaymentLinkId).set({
    id: wompiPaymentLinkId,
    type: 'pack_purchase',
    packSlug,
    userId,
    userEmail,
    amount_in_cents: amountCents,
    baseAmountCents,
    discountCode: discountCode ?? null,
    discountCents: resolvedDiscountCents,
    currency: 'COP',
    isRecurring: false, // Pago único explícito
    status: 'PENDING',
    enrolled: false,
    wompiCheckoutUrl,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt,
    ip,
  });

  await auditLog({
    type: 'payment_attempt',
    severity: 'INFO',
    ip,
    userId,
    metadata: { packSlug, userEmail, amountCents, paymentLinkId: wompiPaymentLinkId },
  });

  return NextResponse.json({ redirectUrl: wompiCheckoutUrl, sessionId: wompiPaymentLinkId });
}
