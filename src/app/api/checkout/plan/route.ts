/**
 * POST /api/checkout/plan
 *
 * Public endpoint (no auth required — new customer buying their first plan).
 * Creates a Wompi payment link for an institutional plan subscription and stores
 * all checkout metadata server-side. The institution and admin account are
 * created ONLY after the Wompi webhook confirms APPROVED status.
 *
 * SECURITY:
 *  - Price is resolved server-side; the client sends NO amount.
 *  - Institution and admin are NOT created here — only after confirmed payment.
 *  - Rate-limited: 3 requests/minute per IP.
 *  - All institution data is stored in Firestore via Admin SDK (server-only write).
 *  - Input validated with Zod before any processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { auditLog } from '@/lib/audit-logger';
import { PlanCheckoutRequestSchema, parseBody } from '@/lib/schemas';

// ── Server-side price table (COP cents) ───────────────────────────────────────
// Client NEVER sets the amount — it's always resolved from here.

const PLAN_PRICES_COP_CENTS: Record<string, number> = {
  pyme:            35_000_000,   // $350 000 COP/mes
  business:        70_000_000,   // $700 000 COP/mes
  corporate:      150_000_000,   // $1 500 000 COP/mes
  enterprise:     300_000_000,   // $3 000 000 COP/mes
  sstSinLicencia:  20_000_000,   // $200 000 COP/mes
  sstConLicencia:  45_000_000,   // $450 000 COP/mes
};

const PLAN_LABELS: Record<string, string> = {
  pyme:            'Plan PYME',
  business:        'Plan Business',
  corporate:       'Plan Corporativo',
  enterprise:      'Plan Enterprise',
  sstSinLicencia:  'Plan SST sin Licencia',
  sstConLicencia:  'Plan SST con Licencia',
};

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 3 checkout initiations / minute per IP (public endpoint)
  const rl = await rateLimiter.check(`checkout-plan:${ip}`, { max: 3, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      },
    );
  }

  // Validate body with Zod
  const parsed = await parseBody(req, PlanCheckoutRequestSchema);
  if (parsed.error) return parsed.error;

  const {
    planType,
    institutionName,
    institutionNit,
    institutionCity,
    institutionType,
    adminEmail,
    adminFirstName,
    adminLastName,
    adminPhone,
  } = parsed.data;

  // Server-side price — never from client
  const amountCents = PLAN_PRICES_COP_CENTS[planType];
  if (!amountCents) {
    return NextResponse.json({ error: 'Plan no válido.' }, { status: 400 });
  }

  // Check for duplicate pending checkout by same NIT (anti-abuse)
  const existing = await adminDb
    .collection('transactions')
    .where('type', '==', 'new_institution_plan')
    .where('institutionNit', '==', institutionNit)
    .where('status', '==', 'PENDING')
    .limit(1)
    .get();

  if (!existing.empty) {
    const existingData = existing.docs[0].data();
    // If existing pending checkout is less than 30 minutes old, return its URL
    const createdAt: Date = existingData.createdAt?.toDate?.() ?? new Date(0);
    const ageMs = Date.now() - createdAt.getTime();
    if (ageMs < 30 * 60 * 1000) {
      return NextResponse.json({
        redirectUrl: existingData.wompiCheckoutUrl ?? '',
        sessionId: existing.docs[0].id,
        amountCents,
      });
    }
  }

  const wompiEnv = process.env.WOMPI_ENV;
  const wompiApiBase =
    wompiEnv === 'production'
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1';
  const wompiKey = process.env.WOMPI_PRIVATE_KEY;

  if (!wompiKey) {
    console.error('[checkout/plan] WOMPI_PRIVATE_KEY not set');
    return NextResponse.json(
      { error: 'Pasarela de pago no disponible. Intenta más tarde.' },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com';

  // Call Wompi to create a single-use hosted payment link
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
        name: `${PLAN_LABELS[planType]} — ${institutionName}`,
        description: `Suscripción mensual ${PLAN_LABELS[planType]} para ${institutionName}`,
        single_use: true,
        collect_shipping: false,
        currency: 'COP',
        amount_in_cents: amountCents,
        redirect_url: `${appUrl}/pago/plan/confirmacion?plan=${encodeURIComponent(planType)}`,
      }),
    });

    if (!wompiRes.ok) {
      const errText = await wompiRes.text();
      console.error('[checkout/plan] Wompi API error:', wompiRes.status, errText);
      return NextResponse.json(
        { error: 'No se pudo crear el enlace de pago. Intenta de nuevo.' },
        { status: 502 },
      );
    }

    const wompiData = (await wompiRes.json()) as {
      data: { id: string; url?: string; payment_link?: { id: string; url: string } };
    };

    wompiPaymentLinkId = wompiData.data.id;
    wompiCheckoutUrl =
      wompiData.data.url ??
      wompiData.data.payment_link?.url ??
      `https://checkout.wompi.co/l/${wompiPaymentLinkId}`;
  } catch (err) {
    console.error('[checkout/plan] fetch error:', err);
    return NextResponse.json(
      { error: 'Error de conexión con la pasarela de pago.' },
      { status: 502 },
    );
  }

  // Store all checkout metadata server-side at transactions/{paymentLinkId}.
  // The webhook looks up this document when the payment link is paid.
  // CRITICAL: institution is NOT created here — only after webhook APPROVED.
  await adminDb.collection('transactions').doc(wompiPaymentLinkId).set({
    id: wompiPaymentLinkId,
    type: 'new_institution_plan',
    planType,
    // Institution details (stored for post-payment creation)
    institutionName,
    institutionNit,
    institutionCity,
    institutionType,
    // Admin contact (stored for invitation email)
    adminEmail,
    adminFirstName,
    adminLastName,
    adminPhone,
    // Payment metadata
    amount_in_cents: amountCents,
    currency: 'COP',
    status: 'PENDING',
    enrolled: false,
    wompiCheckoutUrl,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ip,
  });

  await auditLog({
    type: 'new_institution_checkout_started',
    severity: 'INFO',
    ip,
    metadata: {
      planType,
      institutionNit,
      institutionName,
      adminEmail,
      amountCents,
      paymentLinkId: wompiPaymentLinkId,
    },
  });

  return NextResponse.json({
    redirectUrl: wompiCheckoutUrl,
    sessionId: wompiPaymentLinkId,
    amountCents,
  });
}
