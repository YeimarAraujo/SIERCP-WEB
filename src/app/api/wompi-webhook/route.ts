/**
 * POST /api/wompi-webhook
 *
 * Receives Wompi transaction.updated events and:
 *  1. Validates the HMAC-SHA256 signature (Wompi authenticity).
 *  2. Verifies the transaction's user_id is a real, existing user (IDOR protection).
 *  3. Creates the enrollment only after a confirmed APPROVED status.
 *  4. Is idempotent — re-delivery of the same webhook is safe.
 *
 * NOTE: This endpoint does NOT require a JWT — authenticity is via Wompi HMAC.
 * All writes are server-side only; no client input is trusted beyond the signed payload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { isValidAmountCents } from '@/lib/utils';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp } from '@/lib/rate-limiter';
import { WompiWebhookSchema, type WompiWebhookPayload } from '@/lib/schemas';
import admin from 'firebase-admin';
import type { DocumentReference, DocumentData } from 'firebase-admin/firestore';

// ── Wompi signature validation ─────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isValidWompiSignature(payload: WompiWebhookPayload): Promise<boolean> {
  // Read at call time so tests can set process.env before each request
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!payload.signature?.properties || !payload.signature?.checksum || !secret) return false;

  const parts = payload.signature.properties.map(prop => {
    const keys = prop.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = payload;
    for (const k of keys) val = val?.[k];
    return String(val ?? '');
  });

  const toSign = [...parts, String(payload.timestamp), secret].join('');
  const computed = await sha256(toSign);
  return computed === payload.signature.checksum;
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  let payload: WompiWebhookPayload;

  // Parse and validate incoming JSON with Zod before any processing
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const parsed = WompiWebhookSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    await auditLog({
      type: 'suspicious_activity',
      severity: 'WARN',
      ip,
      metadata: { reason: 'webhook_schema_invalid', details: messages },
    });
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }
  payload = parsed.data;

  // 1. Validate Wompi HMAC signature
  const valid = await isValidWompiSignature(payload);
  if (!valid) {
    await auditLog({
      type: 'suspicious_activity',
      severity: 'CRITICAL',
      ip,
      metadata: {
        reason: 'invalid_wompi_signature',
        event: payload.event,
        timestamp: payload.timestamp,
      },
    });
    console.warn('[wompi-webhook] Invalid signature', { timestamp: payload.timestamp });
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  // 2. Only process transaction.updated
  if (payload.event !== 'transaction.updated') {
    return NextResponse.json({ received: true });
  }

  const tx = payload.data.transaction;

  // 3. Reject amounts outside allowed range
  if (!isValidAmountCents(tx.amount_in_cents)) {
    await auditLog({
      type: 'suspicious_activity',
      severity: 'WARN',
      ip,
      metadata: { reason: 'amount_out_of_range', amount: tx.amount_in_cents, txId: tx.id },
    });
    console.warn('[wompi-webhook] Amount out of range:', tx.amount_in_cents);
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
  }

  const txRef = adminDb.collection('transactions').doc(tx.id);

  // 4. Update transaction status in Firestore (creates/merges the Wompi tx doc)
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
    { merge: true },
  );

  const txDoc = await txRef.get();
  let txData = txDoc.data();

  // 5. For payment-link transactions the business metadata lives at
  //    transactions/{tx.reference} (= Wompi payment link ID), not at
  //    transactions/{tx.id} (= Wompi transaction ID).
  //    Detect this by checking whether user_id is missing from the freshly
  //    merged doc, then fall back to the metadata doc.
  let metaTxRef: DocumentReference<DocumentData> = txRef;

  if (!txData?.user_id && !txData?.userId && tx.reference && tx.reference !== tx.id) {
    const metaDoc = await adminDb.collection('transactions').doc(tx.reference).get();
    if (metaDoc.exists) {
      metaTxRef = adminDb.collection('transactions').doc(tx.reference);
      txData = { ...txData, ...metaDoc.data() };
      // Propagate Wompi status to the metadata doc so Flutter sees the update
      await metaTxRef.update({
        status: tx.status,
        wompiStatus: tx.status,
        wompiTxId: tx.id,
        updated_at: FieldValue.serverTimestamp(),
      });
    }
  }

  // 6. Process APPROVED transactions
  if (tx.status === 'APPROVED') {
    if (!txData) {
      await auditLog({
        type: 'suspicious_activity',
        severity: 'CRITICAL',
        ip,
        metadata: { reason: 'transaction_doc_missing_after_write', txId: tx.id },
      });
      return NextResponse.json({ received: true });
    }

    // ── New institution checkout (no existing user — bypass IDOR check) ──────
    if (txData.type === 'new_institution_plan') {
      if (txData.enrolled) {
        console.log('[wompi-webhook] New institution already created, idempotent skip:', tx.id);
        return NextResponse.json({ received: true });
      }
      try {
        await createNewInstitutionFromCheckout(txData, tx.amount_in_cents);
        await metaTxRef.update({ enrolled: true, enrolled_at: FieldValue.serverTimestamp() });
        await auditLog({
          type: 'institution_created',
          severity: 'INFO',
          ip,
          metadata: {
            source: 'wompi_webhook',
            txId: tx.id,
            planType: txData.planType,
            institutionName: txData.institutionName,
            institutionNit: txData.institutionNit,
            adminEmail: txData.adminEmail,
            amountCents: tx.amount_in_cents,
          },
        });
        console.log(`[wompi-webhook] New institution created: ${txData.institutionName} plan=${txData.planType}`);
      } catch (err) {
        console.error('[wompi-webhook] Institution creation failed:', err);
        await auditLog({
          type: 'payment_failed',
          severity: 'WARN',
          ip,
          metadata: {
            reason: 'institution_creation_failed',
            txId: tx.id,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
      return NextResponse.json({ received: true });
    }

    // ── IDOR protection (all other transaction types require a known user) ────
    const storedUserId: string | undefined = txData.user_id ?? txData.userId;
    if (!storedUserId) {
      await auditLog({
        type: 'suspicious_activity',
        severity: 'CRITICAL',
        ip,
        metadata: {
          reason: 'transaction_missing_user_id',
          txId: tx.id,
          reference: tx.reference,
        },
      });
      console.error('[wompi-webhook] Transaction has no user_id:', tx.id);
      return NextResponse.json({ received: true });
    }

    const userDoc = await adminDb.collection('users').doc(storedUserId).get();
    if (!userDoc.exists) {
      await auditLog({
        type: 'idor_attempt',
        severity: 'CRITICAL',
        ip,
        metadata: {
          reason: 'transaction_user_not_found_in_firestore',
          txId: tx.id,
          storedUserId,
          reference: tx.reference,
        },
      });
      console.error('[wompi-webhook] user_id in transaction does not exist:', storedUserId);
      return NextResponse.json({ received: true });
    }

    // ── Idempotency ──────────────────────────────────────────────────────────
    if (txData.enrolled) {
      console.log('[wompi-webhook] Already enrolled, idempotent skip:', tx.id);
      return NextResponse.json({ received: true });
    }

    // ── Plan subscription ────────────────────────────────────────────────────
    if (txData.type === 'plan_subscription') {
      try {
        await activatePlanSubscription(txData, storedUserId, tx.amount_in_cents);
        await metaTxRef.update({
          enrolled: true,
          enrolled_at: FieldValue.serverTimestamp(),
        });
        await auditLog({
          type: 'plan_subscription_activated',
          userId: storedUserId,
          severity: 'INFO',
          ip,
          metadata: {
            source: 'wompi_webhook',
            txId: tx.id,
            planType: txData.planType,
            institutionId: txData.institutionId,
            amountCents: tx.amount_in_cents,
          },
        });
        console.log(`[wompi-webhook] Plan activated: ${txData.planType} → ${txData.institutionId}`);
      } catch (planErr) {
        console.error('[wompi-webhook] Plan activation failed:', planErr);
        await auditLog({
          type: 'payment_failed',
          userId: storedUserId,
          severity: 'WARN',
          ip,
          metadata: {
            reason: 'plan_activation_failed',
            txId: tx.id,
            error: planErr instanceof Error ? planErr.message : String(planErr),
          },
        });
      }
      return NextResponse.json({ received: true });
    }

    // ── Course enrollment ────────────────────────────────────────────────────
    try {
      await createEnrollmentFromTransaction(txData, tx, storedUserId);
      await metaTxRef.update({
        enrolled: true,
        enrolled_at: FieldValue.serverTimestamp(),
      });

      await auditLog({
        type: 'enrollment_created',
        userId: storedUserId,
        severity: 'INFO',
        ip,
        metadata: {
          source: 'wompi_webhook',
          txId: tx.id,
          reference: tx.reference,
          cursoSlug: txData.curso_slug,
          amountCents: tx.amount_in_cents,
        },
      });

      // Fire-and-forget payment receipt email
      try {
        const { NotificationService } = await import('@/services/notification.service');
        const userData = userDoc.data() ?? {};
        await NotificationService.sendPaymentReceipt({
          toEmail: tx.customer_email || userData.email || '',
          nombre: `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim() || 'Estudiante',
          courseTitle: txData.course_title || txData.curso_slug || 'Curso',
          amountCents: tx.amount_in_cents,
          reference: tx.reference,
        });
      } catch (emailErr) {
        console.warn('[wompi-webhook] Payment receipt email skipped:', emailErr);
      }

      console.log(`[wompi-webhook] Enrollment completed: ${storedUserId} → ${txData.curso_slug}`);
    } catch (enrollErr) {
      console.error('[wompi-webhook] Enrollment failed:', enrollErr);
      await auditLog({
        type: 'payment_failed',
        userId: storedUserId,
        severity: 'WARN',
        ip,
        metadata: {
          reason: 'enrollment_creation_failed',
          txId: tx.id,
          error: enrollErr instanceof Error ? enrollErr.message : String(enrollErr),
        },
      });
    }
  }

  // Wompi always expects 200
  return NextResponse.json({ received: true });
}

// ── Create new institution after first-time plan purchase ─────────────────────

async function createNewInstitutionFromCheckout(
  txData: FirebaseFirestore.DocumentData,
  amountCents: number,
) {
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
  } = txData as Record<string, string>;

  if (!institutionName || !planType || !adminEmail) {
    console.warn('[wompi-webhook] createNewInstitutionFromCheckout: missing required fields');
    return;
  }

  const now = FieldValue.serverTimestamp();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Create the institution — only now, after confirmed payment
  const institutionRef = adminDb.collection('institutions').doc();
  await institutionRef.set({
    name: institutionName,
    nit: institutionNit ?? '',
    city: institutionCity ?? '',
    type: institutionType ?? 'empresa',
    status: 'active',
    adminEmail,
    planMembership: {
      plan: planType,
      status: 'active',
      activatedAt: now,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      lastPaymentCents: amountCents,
    },
    createdAt: now,
    updatedAt: now,
  });

  // Send admin invitation email so they can set up their account
  try {
    const { NotificationService } = await import('@/services/notification.service');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com';
    const registerUrl = `${appUrl}/register?email=${encodeURIComponent(adminEmail)}&institution=${institutionRef.id}&role=ADMIN`;
    await NotificationService.sendInstitutionWelcome({
      toEmail: adminEmail,
      nombre: `${adminFirstName ?? ''} ${adminLastName ?? ''}`.trim() || adminEmail,
      institutionName,
      planType,
      registerUrl,
      adminPhone: adminPhone ?? '',
    });
  } catch (emailErr) {
    console.warn('[wompi-webhook] Institution welcome email skipped:', emailErr);
  }

  console.log(`[wompi-webhook] Institution created: ${institutionRef.id} (${institutionName})`);
}

// ── Activate plan subscription ─────────────────────────────────────────────

async function activatePlanSubscription(
  txData: FirebaseFirestore.DocumentData,
  userId: string,
  amountCents: number,
) {
  const { institutionId, planType } = txData as {
    institutionId?: string;
    planType?: string;
  };

  if (!institutionId || !planType) {
    console.warn('[wompi-webhook] activatePlanSubscription: missing institutionId or planType');
    return;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30-day subscription period

  await adminDb.collection('institutions').doc(institutionId).update({
    'planMembership.plan': planType,
    'planMembership.status': 'active',
    'planMembership.activatedAt': now,
    'planMembership.expiresAt': admin.firestore.Timestamp.fromDate(expiresAt),
    'planMembership.activatedBy': userId,
    'planMembership.lastPaymentCents': amountCents,
    updatedAt: now,
  });
}

// ── Create enrollment from verified transaction data ───────────────────────

async function createEnrollmentFromTransaction(
  txData: FirebaseFirestore.DocumentData,
  tx: WompiWebhookPayload['data']['transaction'],
  userId: string,
) {
  const cursoSlug = txData.curso_slug;
  const cohortId = txData.grupo_id || txData.cohort_id || '';
  const templateId = txData.template_id || '';
  const institutionId = txData.institution_id || 'jomar-seguridad';

  if (!cursoSlug) {
    console.warn('[wompi-webhook] Missing cursoSlug in transaction');
    return;
  }

  // Get user data
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data() ?? {};
  const studentName = `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim();

  // Resolve template
  let resolvedTemplateId = templateId;
  let resolvedCohortId = cohortId;
  let courseTitle = cursoSlug;

  if (!resolvedTemplateId && cursoSlug) {
    const templateSnap = await adminDb
      .collection('course_templates')
      .where('slug', '==', cursoSlug)
      .limit(1)
      .get();
    if (!templateSnap.empty) {
      resolvedTemplateId = templateSnap.docs[0].id;
      courseTitle = templateSnap.docs[0].data().title || cursoSlug;
    }
  } else if (resolvedTemplateId) {
    const templateSnap = await adminDb
      .collection('course_templates')
      .doc(resolvedTemplateId)
      .get();
    if (templateSnap.exists) {
      courseTitle = templateSnap.data()?.title || cursoSlug;
    }
  }

  if (!resolvedCohortId && cursoSlug) {
    const cohortSnap = await adminDb
      .collection('cohorts')
      .where('courseSlug', '==', cursoSlug)
      .where('status', '==', 'abierto')
      .limit(1)
      .get();
    if (!cohortSnap.empty) {
      resolvedCohortId = cohortSnap.docs[0].id;
    }
  }

  // Idempotency: check for existing active enrollment
  if (cursoSlug) {
    const existing = await adminDb
      .collection('platform_enrollments')
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

  // Create enrollment
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

  // Atomic cohort increment
  if (resolvedCohortId) {
    try {
      await adminDb.collection('cohorts').doc(resolvedCohortId).update({
        enrolledCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const { handleCohortFull } = await import('@/lib/automation-engine');
      await handleCohortFull(adminDb, resolvedCohortId);
    } catch (e) {
      console.warn('[wompi-webhook] Cohort increment skipped:', e);
    }
  }

  // Legacy enrollment subcollection
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

  // Update user.enrolledCourses
  try {
    await adminDb.collection('users').doc(userId).update({
      enrolledCourses: admin.firestore.FieldValue.arrayUnion(cursoSlug),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn('[wompi-webhook] enrolledCourses update skipped:', e);
  }
}
