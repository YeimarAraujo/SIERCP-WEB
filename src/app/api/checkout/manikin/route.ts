/**
 * POST /api/checkout/manikin
 *
 * Crea un payment link de Wompi para la compra de maniquíes (hardware).
 * No requiere autenticación — cualquier persona puede comprar.
 *
 * SEGURIDAD:
 *  - Precio resuelto en el servidor; el cliente nunca envía el monto.
 *  - El pedido se almacena en `transactions/{paymentLinkId}` en estado PENDING.
 *  - La orden solo se confirma con el webhook firmado de Wompi (APPROVED).
 *  - Rate-limited: 3 req/min por IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { auditLog } from '@/lib/audit-logger';
import { ManikinCheckoutRequestSchema, parseBody } from '@/lib/schemas';

// Precios server-side (COP centavos) — el cliente NUNCA envía el monto
const MANIKIN_PRICES_CENTS: Record<string, number> = {
  'unidad':  195_000_000,  // $1.950.000 COP
  'pack-4':  663_000_000,  // $6.630.000 COP
  'pack-8': 1_170_000_000, // $11.700.000 COP
};

const MANIKIN_LABELS: Record<string, string> = {
  'unidad':  'Maniquí SIERCP — Unidad',
  'pack-4':  'Pack 4 Maniquíes SIERCP',
  'pack-8':  'Pack 8 Maniquíes SIERCP',
};

const MAX_DISCOUNT_PERCENT = 30; // Límite de descuento de código promo

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const rl = await rateLimiter.check(`checkout-manikin:${ip}`, { max: 3, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const parsed = await parseBody(req, ManikinCheckoutRequestSchema);
  if (parsed.error) return parsed.error;

  const { packSlug, buyerName, buyerEmail, buyerPhone, shippingAddress, discountCode, discountCents: clientDiscountCents } = parsed.data;

  // Resolve price server-side
  const baseAmountCents = MANIKIN_PRICES_CENTS[packSlug];
  if (!baseAmountCents) {
    return NextResponse.json({ error: 'Paquete no válido.' }, { status: 400 });
  }

  // Validate discount if provided (cap to MAX_DISCOUNT_PERCENT of base price)
  let resolvedDiscountCents = 0;
  if (discountCode && clientDiscountCents && clientDiscountCents > 0) {
    const snap = await adminDb.collection('discount_codes').doc(discountCode).get();
    if (snap.exists && snap.data()!.active) {
      const data = snap.data()!;
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${wompiKey}`,
      },
      body: JSON.stringify({
        name: MANIKIN_LABELS[packSlug] ?? `Pack ${packSlug}`,
        description: `Compra de ${MANIKIN_LABELS[packSlug] ?? packSlug} — Entrega a ${shippingAddress.city}, ${shippingAddress.department}`,
        single_use: true,
        collect_shipping: false,
        currency: 'COP',
        amount_in_cents: amountCents,
        redirect_url: `${appUrl}/checkout/resultado?tipo=manikin`,
      }),
    });

    if (!wompiRes.ok) {
      const errText = await wompiRes.text();
      console.error('[checkout/manikin] Wompi error:', wompiRes.status, errText);
      return NextResponse.json({ error: 'No se pudo crear el enlace de pago.' }, { status: 502 });
    }

    const wompiData = await wompiRes.json() as {
      data: { id: string; url?: string; payment_link?: { url: string } };
    };
    wompiPaymentLinkId = wompiData.data.id;
    wompiCheckoutUrl = wompiData.data.url ?? wompiData.data.payment_link?.url ?? `https://checkout.wompi.co/l/${wompiPaymentLinkId}`;
  } catch (err) {
    console.error('[checkout/manikin] fetch error:', err);
    return NextResponse.json({ error: 'Error de conexión con la pasarela.' }, { status: 502 });
  }

  // TTL: 30 minutos para la sesión de checkout
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await adminDb.collection('transactions').doc(wompiPaymentLinkId).set({
    id: wompiPaymentLinkId,
    type: 'manikin_purchase',
    packSlug,
    // Buyer info
    buyerName,
    buyerEmail,
    buyerPhone,
    // Shipping
    shippingAddress,
    // Payment
    amount_in_cents: amountCents,
    baseAmountCents,
    discountCode: discountCode ?? null,
    discountCents: resolvedDiscountCents,
    currency: 'COP',
    status: 'PENDING',
    enrolled: false,
    wompiCheckoutUrl,
    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt,
    ip,
  });

  await auditLog({
    type: 'payment_attempt',
    severity: 'INFO',
    ip,
    metadata: { packSlug, buyerEmail, amountCents, paymentLinkId: wompiPaymentLinkId },
  });

  return NextResponse.json({ redirectUrl: wompiCheckoutUrl, sessionId: wompiPaymentLinkId });
}
