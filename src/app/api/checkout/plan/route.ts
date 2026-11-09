/**
 * POST /api/checkout/plan
 *
 * Inicia la compra de un plan corporativo. La cuenta del comprador ya existe
 * (Authorization: Bearer <ID token>) pero la institución NO se crea aquí: solo
 * después de que el webhook de Wompi confirme APPROVED.
 *
 * - El monto se resuelve en servidor; el cliente no lo envía.
 * - El perfil base se crea sin privilegios; el rol ADMIN llega con el pago.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { auditLog } from '@/lib/audit-logger';
import { PlanCheckoutRequestSchema, parseBody } from '@/lib/schemas';
import { resolvePlanQuote } from '@/lib/plan-pricing';
import { appBaseUrl, createWompiPaymentLink } from '@/lib/wompi-link';

export const dynamic = 'force-dynamic';

const REUSE_PENDING_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const rl = await rateLimiter.check(`checkout-plan:${ip}`, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const authz = req.headers.get('authorization') ?? '';
  if (!authz.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Debes iniciar sesión para continuar.' }, { status: 401 });
  }
  let uid: string;
  let tokenEmail: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authz.slice(7));
    uid = decoded.uid;
    tokenEmail = (decoded.email ?? '').toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' }, { status: 401 });
  }

  const parsed = await parseBody(req, PlanCheckoutRequestSchema);
  if (parsed.error) return parsed.error;
  const data = parsed.data;
  const nit = data.institutionNit.replace(/\D/g, '');

  const quote = await resolvePlanQuote(data.planType);
  if (!quote) {
    return NextResponse.json({ error: 'Este plan no está disponible para compra en línea.' }, { status: 400 });
  }

  const taken = await adminDb.collection('institutions').where('nit', '==', nit).limit(1).get();
  if (!taken.empty) {
    return NextResponse.json({ error: 'Ya existe una institución registrada con este NIT.' }, { status: 409 });
  }

  // Reintento del mismo comprador: reutiliza el enlace si el monto no cambió.
  const pending = await adminDb.collection('transactions')
    .where('user_id', '==', uid)
    .where('institutionNit', '==', nit)
    .where('status', '==', 'PENDING')
    .limit(1)
    .get();
  if (!pending.empty) {
    const previous = pending.docs[0].data();
    const createdAt: Date = previous.createdAt?.toDate?.() ?? new Date(0);
    const fresh = Date.now() - createdAt.getTime() < REUSE_PENDING_MS;
    if (fresh && previous.amount_in_cents === quote.amountCents && previous.planType === quote.slug) {
      return NextResponse.json({
        redirectUrl: previous.wompiCheckoutUrl,
        sessionId: pending.docs[0].id,
        amountCents: quote.amountCents,
      });
    }
  }

  let link: { id: string; url: string };
  try {
    link = await createWompiPaymentLink({
      name: `${quote.name} — SIERCP`,
      description: `Contrato anual ${quote.name} para ${data.institutionName}`,
      amountCents: quote.amountCents,
      redirectUrl: `${appBaseUrl(req.nextUrl.origin)}/pago/plan/confirmacion?plan=${encodeURIComponent(quote.slug)}`,
    });
  } catch (err) {
    console.error('[checkout/plan]', err);
    return NextResponse.json({ error: 'No se pudo conectar con la pasarela de pago.' }, { status: 502 });
  }

  // Sin privilegios: solo garantiza que el comprador tenga perfil al volver.
  const userRef = adminDb.collection('users').doc(uid);
  if (!(await userRef.get()).exists) {
    await userRef.set({
      uid,
      email: tokenEmail || data.adminEmail,
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
      phoneNumber: data.adminPhone,
      role: 'USUARIO',
      isActive: true,
      certVerification: 'NONE',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await adminDb.collection('transactions').doc(link.id).set({
    id: link.id,
    type: 'new_institution_plan',
    planType: quote.slug,
    planName: quote.name,
    user_id: uid,
    institutionName: data.institutionName,
    institutionNit: nit,
    institutionCity: data.institutionCity,
    institutionDepartment: data.institutionDepartment,
    institutionAddress: data.institutionAddress,
    institutionPhone: data.institutionPhone,
    institutionEmail: data.institutionEmail,
    institutionType: data.institutionType,
    adminEmail: tokenEmail || data.adminEmail,
    adminFirstName: data.adminFirstName,
    adminLastName: data.adminLastName,
    adminPhone: data.adminPhone,
    adminDocumentType: data.adminDocumentType,
    adminIdentification: data.adminIdentification,
    adminCity: data.adminCity,
    adminDepartment: data.adminDepartment,
    adminAddress: data.adminAddress,
    subtotalCOP: quote.subtotalCOP,
    ivaCOP: quote.ivaCOP,
    amount_in_cents: quote.amountCents,
    currency: 'COP',
    status: 'PENDING',
    enrolled: false,
    wompiCheckoutUrl: link.url,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ip,
  });

  await auditLog({
    type: 'new_institution_checkout_started',
    severity: 'INFO',
    userId: uid,
    ip,
    metadata: { planType: quote.slug, institutionNit: nit, amountCents: quote.amountCents, paymentLinkId: link.id },
  });

  return NextResponse.json({ redirectUrl: link.url, sessionId: link.id, amountCents: quote.amountCents });
}
