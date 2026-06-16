import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { createWompiPaymentLink } from '@/lib/wompi-link';

/**
 * POST /api/checkout/course  (Spark — reemplaza CF createWompiCourseTransaction)
 *
 * Estudiante autenticado compra la inscripción a un curso. Auth: Bearer ID token.
 * El precio se resuelve en servidor (cohort → template → slug). Idempotente.
 * Body: { cursoSlug, cohortId?, templateId?, institutionId? }
 * Returns: { redirectUrl, transactionId, amountCents, courseTitle }
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

  const body = (await req.json().catch(() => null)) as
    | { cursoSlug?: string; cohortId?: string; templateId?: string; institutionId?: string } | null;
  const cursoSlug = body?.cursoSlug;
  if (!cursoSlug || typeof cursoSlug !== 'string' || cursoSlug.length > 100) {
    return NextResponse.json({ error: 'cursoSlug inválido' }, { status: 400 });
  }

  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  // Resolución de precio server-side: cohort → template → slug
  let priceCents = 0;
  let courseTitle = cursoSlug;
  let cohortId = body?.cohortId ?? '';
  let templateId = body?.templateId ?? '';

  if (cohortId) {
    const c = await adminDb.collection('cohorts').doc(cohortId).get();
    if (c.exists) {
      const d = c.data()!;
      priceCents = (d.priceCOP ?? 0) * 100;
      courseTitle = d.courseTitle ?? courseTitle;
      if (!templateId) templateId = d.templateId ?? '';
    }
  }
  if (!priceCents && templateId) {
    const t = await adminDb.collection('course_templates').doc(templateId).get();
    if (t.exists) { const d = t.data()!; priceCents = (d.priceCOP ?? 0) * 100; courseTitle = d.title ?? courseTitle; }
  }
  if (!priceCents) {
    const ts = await adminDb.collection('course_templates').where('slug', '==', cursoSlug).limit(1).get();
    if (!ts.empty) { const d = ts.docs[0].data(); priceCents = (d.priceCOP ?? 0) * 100; courseTitle = d.title ?? courseTitle; templateId = ts.docs[0].id; }
  }
  if (!priceCents) {
    return NextResponse.json({ error: 'Curso no encontrado o sin precio asignado.' }, { status: 404 });
  }

  // Idempotencia: rechazar si ya hay inscripción APPROVED de este curso
  const existing = await adminDb.collection('transactions')
    .where('user_id', '==', uid).where('curso_slug', '==', cursoSlug)
    .where('status', '==', 'APPROVED').limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: 'Ya tienes una inscripción aprobada para este curso.' }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com';
  let link: { id: string; url: string };
  try {
    link = await createWompiPaymentLink({
      name: courseTitle,
      description: `Inscripción al curso ${courseTitle} en SIERCP`,
      amountCents: priceCents,
      redirectUrl: `${appUrl}/checkout/resultado?curso=${encodeURIComponent(cursoSlug)}&cohort=${encodeURIComponent(cohortId)}`,
    });
  } catch (e) {
    console.error('[checkout/course]', e);
    return NextResponse.json({ error: 'No se pudo conectar con la pasarela de pago.' }, { status: 502 });
  }

  await adminDb.collection('transactions').doc(link.id).set({
    id: link.id, type: 'course_enrollment', user_id: uid, customer_email: userDoc.data()?.email ?? '',
    curso_slug: cursoSlug, cohort_id: cohortId, template_id: templateId,
    institution_id: body?.institutionId ?? null, course_title: courseTitle,
    amount_in_cents: priceCents, currency: 'COP', status: 'PENDING', enrolled: false,
    createdAt: admin.firestore.Timestamp.now(), updatedAt: admin.firestore.Timestamp.now(),
  });

  return NextResponse.json({ redirectUrl: link.url, transactionId: link.id, amountCents: priceCents, courseTitle });
}
