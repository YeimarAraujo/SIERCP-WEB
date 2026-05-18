/**
 * POST /api/wompi-webhook
 *
 * Recibe eventos de Wompi (transaction.updated) y actualiza
 * el estado de la inscripción en Firestore.
 *
 * Configuración en el dashboard de Wompi:
 *   URL: https://tu-dominio.com/api/wompi-webhook
 *   Eventos: transaction.updated
 *
 * IMPORTANTE: Este endpoint NO requiere autenticación JWT propia —
 * la autenticidad se valida con la firma HMAC-SHA256 de Wompi.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { isValidAmountCents } from '@/lib/utils';
import admin from 'firebase-admin';

const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET!;

// ─── Validación de firma Wompi ─────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Valida que el webhook proviene de Wompi.
 * Wompi firma: properties[0_value] + ... + timestamp + events_secret
 */
async function isValidWompiSignature(payload: WompiWebhookPayload): Promise<boolean> {
  if (!payload.signature?.properties || !payload.signature?.checksum) return false;

  const parts = payload.signature.properties.map(prop => {
    const keys = prop.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = payload;
    for (const k of keys) val = val?.[k];
    return String(val ?? '');
  });

  const toSign = [...parts, String(payload.timestamp), WOMPI_EVENTS_SECRET].join('');
  const computed = await sha256(toSign);
  return computed === payload.signature.checksum;
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface WompiWebhookPayload {
  event: string;
  data: {
    transaction: {
      id: string;
      reference: string;
      status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
      amount_in_cents: number;
      currency: string;
      payment_method_type: string;
      customer_email: string;
      finalized_at: string | null;
      error_code: string | null;
      status_message: string | null;
    };
  };
  environment: 'test' | 'production';
  sent_at: string;
  timestamp: number;
  signature: {
    checksum: string;
    properties: string[];
  };
}

// ─── Route Handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let payload: WompiWebhookPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  // 1. Validar firma de Wompi — rechazar si no coincide
  const valid = await isValidWompiSignature(payload);
  if (!valid) {
    console.warn('[wompi-webhook] Firma inválida', { timestamp: payload.timestamp });
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  // 2. Solo procesar transaction.updated
  if (payload.event !== 'transaction.updated') {
    return NextResponse.json({ received: true });
  }

  const tx = payload.data.transaction;

  // 3a. Rechazar montos fuera del rango permitido (protección ante manipulación)
  if (!isValidAmountCents(tx.amount_in_cents)) {
    console.warn('[wompi-webhook] Monto fuera de rango:', tx.amount_in_cents);
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
  }

  const txRef = adminDb.collection('transactions').doc(tx.id);

  // 3. Actualizar el documento de transacción en Firestore
  await txRef.set(
    {
      status: tx.status,
      wompiStatus: tx.status,
      finalized_at: tx.finalized_at ? new Date(tx.finalized_at) : null,
      error_code: tx.error_code,
      status_message: tx.status_message,
      webhookReceivedAt: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 4. Si fue APPROVED, crear la inscripción del estudiante
  if (tx.status === 'APPROVED') {
    const txDoc = await txRef.get();
    const txData = txDoc.data();

    if (txData && !txData.enrolled) {
      try {
        await createEnrollmentFromTransaction(txData, tx);
        // Marcar como inscrito para idempotencia
        await txRef.update({ enrolled: true, enrolled_at: FieldValue.serverTimestamp() });
        console.log(`[wompi-webhook] Enrollment completed for ${txData.user_id} → ${txData.curso_slug}`);
      } catch (enrollErr) {
        console.error('[wompi-webhook] Enrollment failed:', enrollErr);
      }
    }
  }

  // Wompi espera siempre un 200
  return NextResponse.json({ received: true });
}

// ─── Create enrollment from transaction data ───────────────────────────────

async function createEnrollmentFromTransaction(
  txData: FirebaseFirestore.DocumentData,
  tx: WompiWebhookPayload['data']['transaction'],
) {
  const userId = txData.user_id;
  const cursoSlug = txData.curso_slug;
  const cohortId = txData.grupo_id || txData.cohort_id || '';
  const templateId = txData.template_id || '';
  const institutionId = txData.institution_id || 'jomar-seguridad';

  if (!userId || !cursoSlug) {
    console.warn('[wompi-webhook] Missing userId or cursoSlug in transaction');
    return;
  }

  // Get user data
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data() ?? {};
  const studentName = `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim();

  // Resolve template and cohort if missing
  let resolvedTemplateId = templateId;
  let resolvedCohortId = cohortId;
  let courseTitle = cursoSlug;

  if (!resolvedTemplateId && cursoSlug) {
    const templateSnap = await adminDb.collection('course_templates')
      .where('slug', '==', cursoSlug)
      .limit(1)
      .get();
    if (!templateSnap.empty) {
      resolvedTemplateId = templateSnap.docs[0].id;
      courseTitle = templateSnap.docs[0].data().title || cursoSlug;
    }
  } else if (resolvedTemplateId) {
    const templateSnap = await adminDb.collection('course_templates').doc(resolvedTemplateId).get();
    if (templateSnap.exists) {
      courseTitle = templateSnap.data()?.title || cursoSlug;
    }
  }

  if (!resolvedCohortId && cursoSlug) {
    const cohortSnap = await adminDb.collection('cohorts')
      .where('courseSlug', '==', cursoSlug)
      .where('status', '==', 'abierto')
      .limit(1)
      .get();
    if (!cohortSnap.empty) {
      resolvedCohortId = cohortSnap.docs[0].id;
    }
  }

  // Check for duplicate enrollment (idempotency)
  if (cursoSlug) {
    const existing = await adminDb.collection('platform_enrollments')
      .where('userId', '==', userId)
      .where('courseSlug', '==', cursoSlug)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log('[wompi-webhook] Student already enrolled, skipping');
      return;
    }
  }

  // 1. Create platform enrollment
  const enrollmentRef = adminDb.collection('platform_enrollments').doc();
  await enrollmentRef.set({
    userId,
    email: tx.customer_email || userData.email || '',
    studentName,
    institutionId,
    templateId: resolvedTemplateId || '',
    cohortId: resolvedCohortId || '',
    courseSlug: cursoSlug,
    courseTitle,
    paymentId: tx.id,
    paymentMethod: tx.payment_method_type || 'CARD',
    amountPaid: tx.amount_in_cents / 100,
    status: 'active',
    enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: null,
    certificateId: null,
  });

  // 2. Increment cohort enrolled count
  if (resolvedCohortId) {
    try {
      await adminDb.collection('cohorts').doc(resolvedCohortId).update({
        enrolledCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn('[wompi-webhook] Cohort increment skipped:', e);
    }
  }

  // 3. Legacy: create enrollment subcollection on matching course
  try {
    const coursesSnap = await adminDb.collection('courses')
      .where('isActive', '==', true)
      .get();

    for (const courseDoc of coursesSnap.docs) {
      const courseData = courseDoc.data();
      const matchSlug = (courseData.slug || courseData.title || '').toLowerCase()
        .replace(/\s+/g, '-');
      if (matchSlug === cursoSlug || courseData.title === courseTitle) {
        await adminDb.collection('courses').doc(courseDoc.id)
          .collection('enrollments').doc(userId).set({
            studentId: userId,
            studentName,
            studentEmail: tx.customer_email || userData.email || '',
            enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
            completedModules: 0,
            avgScore: 0,
            sessionCount: 0,
            status: 'active',
            grupoId: cohortId,
            paymentReference: tx.reference,
            wompiTransactionId: tx.id,
          });
        break;
      }
    }
  } catch (e) {
    console.warn('[wompi-webhook] Legacy enrollment skipped:', e);
  }

  // 4. Update user.enrolledCourses
  try {
    await adminDb.collection('users').doc(userId).update({
      enrolledCourses: admin.firestore.FieldValue.arrayUnion(cursoSlug),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn('[wompi-webhook] User enrolledCourses update skipped:', e);
  }
}