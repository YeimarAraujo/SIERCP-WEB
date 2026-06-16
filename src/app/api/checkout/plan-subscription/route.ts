import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { createWompiPaymentLink, PLAN_PRICES_COP_CENTS } from '@/lib/wompi-link';

/**
 * POST /api/checkout/plan-subscription  (Spark — reemplaza CF createWompiPlanTransaction)
 *
 * ADMIN autenticado (de la institución) o SUPER_ADMIN inicia el pago mensual de
 * un plan. Auth: Bearer ID token. Precio resuelto en servidor.
 * Body: { planType, institutionId }
 * Returns: { redirectUrl, transactionId, amountCents }
 */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization') ?? '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { planType?: string; institutionId?: string } | null;
  const planType = body?.planType;
  const institutionId = body?.institutionId;
  if (!planType || !(planType in PLAN_PRICES_COP_CENTS)) {
    return NextResponse.json({ error: 'Tipo de plan inválido' }, { status: 400 });
  }
  if (!institutionId || typeof institutionId !== 'string' || institutionId.length > 128) {
    return NextResponse.json({ error: 'institutionId inválido' }, { status: 400 });
  }

  // Permisos: SUPER_ADMIN o ADMIN de la institución.
  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (userDoc.data()?.role !== 'SUPER_ADMIN') {
    const member = await adminDb.collection('memberships')
      .where('userId', '==', uid).where('institutionId', '==', institutionId)
      .where('role', '==', 'ADMIN').limit(1).get();
    if (member.empty) {
      return NextResponse.json({ error: 'Solo el ADMIN de la institución puede gestionar suscripciones.' }, { status: 403 });
    }
  }

  const amountCents = PLAN_PRICES_COP_CENTS[planType];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com';

  let link: { id: string; url: string };
  try {
    link = await createWompiPaymentLink({
      name: `Plan ${planType} — SIERCP`,
      description: `Suscripción mensual al plan ${planType} para tu institución en SIERCP`,
      amountCents,
      redirectUrl: `${appUrl}/pago/plan/confirmacion?institution=${encodeURIComponent(institutionId)}&plan=${encodeURIComponent(planType)}`,
    });
  } catch (e) {
    console.error('[plan-subscription]', e);
    return NextResponse.json({ error: 'No se pudo conectar con la pasarela de pago.' }, { status: 502 });
  }

  await adminDb.collection('transactions').doc(link.id).set({
    id: link.id, type: 'plan_subscription', planType, institutionId, user_id: uid,
    amount_in_cents: amountCents, currency: 'COP', status: 'PENDING', enrolled: false,
    createdAt: admin.firestore.Timestamp.now(), updatedAt: admin.firestore.Timestamp.now(),
  });

  return NextResponse.json({ redirectUrl: link.url, transactionId: link.id, amountCents });
}
