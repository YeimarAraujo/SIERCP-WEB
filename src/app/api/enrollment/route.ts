/**
 * POST /api/enrollment
 *
 * Handles course enrollment. Two authorized paths:
 *
 *  A) ADMIN / SUPER_ADMIN: can enroll any user in any course (no payment required).
 *     Used for manual enrollments, scholarships, or admin-forced inscriptions.
 *
 *  B) Authenticated USUARIO: can only enroll themselves. If the course is paid,
 *     MUST provide a `paymentId` that corresponds to an APPROVED Wompi transaction
 *     where `user_id === auth.uid`. Free courses (isFree: true in Firestore) are exempt.
 *
 * The Wompi webhook path (wompi-webhook/route.ts) is the primary enrollment trigger
 * for paid courses. This endpoint exists as a fallback and for admin use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sanitize } from '@/lib/utils';
import { handleCohortFull } from '@/lib/automation-engine';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { withAuth, isAdmin } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { EnrollmentRequestSchema, parseBody } from '@/lib/schemas';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    // ── Rate limiting ────────────────────────────────────────────────────────
    const rl = await rateLimiter.check(`enrollment:${ip}`, { max: 10, windowMs: 600_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    // ── Authentication — REQUIRED ───────────────────────────────────────────
    const auth = await withAuth(req);
    if (auth instanceof NextResponse) {
      await auditLog({
        type: 'enrollment_unauthorized_attempt',
        severity: 'WARN',
        ip,
        metadata: { reason: 'missing_or_invalid_token' },
      });
      return auth;
    }

    // ── Parse and validate body with Zod ────────────────────────────────────
    const parsed = await parseBody(req, EnrollmentRequestSchema);
    if (parsed.error) return parsed.error;

    // Sanitize after validation — Zod guarantees types, sanitize strips XSS
    const email = sanitize(parsed.data.email);
    const nombre = sanitize(parsed.data.nombre);
    const telefono = sanitize(parsed.data.telefono);
    const cursoSlug = sanitize(parsed.data.cursoSlug);
    const cohortId = sanitize(parsed.data.cohortId);
    const templateId = sanitize(parsed.data.templateId);
    const institutionId = sanitize(parsed.data.institutionId);
    const paymentId = sanitize(parsed.data.paymentId);
    const paymentMethod = sanitize(parsed.data.paymentMethod) || 'CARD';
    const amountPaid = parsed.data.amountPaid;
    const grupoId = sanitize(parsed.data.grupoId);

    const effectiveCohortId = cohortId || grupoId;

    // ── Authorization: who can enroll whom ──────────────────────────────────
    //
    // ADMINs can enroll anyone.
    // Regular users can only enroll themselves — verify email matches their account.
    if (!isAdmin(auth)) {
      const callerDoc = await adminDb.collection('users').doc(auth.uid).get();
      const callerEmail = callerDoc.data()?.email ?? '';
      if (callerEmail.toLowerCase() !== email.toLowerCase()) {
        await auditLog({
          type: 'enrollment_unauthorized_attempt',
          userId: auth.uid,
          severity: 'WARN',
          ip,
          metadata: {
            reason: 'email_mismatch',
            callerEmail,
            targetEmail: email,
            cursoSlug,
          },
        });
        return NextResponse.json(
          { error: 'Solo puedes inscribirte a ti mismo.' },
          { status: 403 },
        );
      }
    }

    // ── Payment verification for paid courses ────────────────────────────────
    //
    // Skip for ADMINs (they can enroll for free as a management action).
    // Skip if course is marked isFree in Firestore.
    // Otherwise, require an APPROVED transaction owned by the caller.
    if (!isAdmin(auth)) {
      // Check if course is free
      let courseIsFree = false;
      if (cursoSlug) {
        const templateSnap = await adminDb
          .collection('course_templates')
          .where('slug', '==', cursoSlug)
          .limit(1)
          .get();
        if (!templateSnap.empty) {
          const templateData = templateSnap.docs[0].data();
          courseIsFree = templateData.isFree === true || (templateData.priceCOP ?? 0) === 0;
        }
      }

      if (!courseIsFree) {
        // Require paymentId and verify it is APPROVED and belongs to this user
        if (!paymentId) {
          await auditLog({
            type: 'enrollment_free_bypass_attempt',
            userId: auth.uid,
            severity: 'WARN',
            ip,
            metadata: { reason: 'no_payment_id_for_paid_course', cursoSlug },
          });
          return NextResponse.json(
            { error: 'Se requiere un pago aprobado para inscribirse a este curso.' },
            { status: 403 },
          );
        }

        // Look up the transaction
        const txDoc = await adminDb.collection('transactions').doc(paymentId).get();
        if (!txDoc.exists) {
          await auditLog({
            type: 'enrollment_free_bypass_attempt',
            userId: auth.uid,
            severity: 'WARN',
            ip,
            metadata: { reason: 'transaction_not_found', paymentId, cursoSlug },
          });
          return NextResponse.json(
            { error: 'Transacción de pago no encontrada.' },
            { status: 403 },
          );
        }

        const txData = txDoc.data()!;
        const txStatus = txData.status ?? txData.wompiStatus;
        const txUserId = txData.user_id ?? txData.userId;

        // Must be APPROVED
        if (txStatus !== 'APPROVED') {
          await auditLog({
            type: 'enrollment_free_bypass_attempt',
            userId: auth.uid,
            severity: 'WARN',
            ip,
            metadata: { reason: 'transaction_not_approved', paymentId, txStatus, cursoSlug },
          });
          return NextResponse.json(
            { error: `El pago tiene estado "${txStatus}". Solo pagos APPROVED permiten inscripción.` },
            { status: 403 },
          );
        }

        // Must belong to the authenticated user (IDOR protection)
        if (txUserId !== auth.uid) {
          await auditLog({
            type: 'idor_attempt',
            userId: auth.uid,
            severity: 'CRITICAL',
            ip,
            metadata: {
              reason: 'transaction_user_mismatch',
              paymentId,
              txUserId,
              callerUid: auth.uid,
              cursoSlug,
            },
          });
          return NextResponse.json(
            { error: 'Esta transacción no pertenece a tu cuenta.' },
            { status: 403 },
          );
        }
      }
    }

    // ── 1. Create or find user ────────────────────────────────────────────────
    let userId: string;
    let isNewUser = false;
    let tempPassword: string | null = null;

    // For self-enrollment, use the authenticated user's UID directly
    if (!isAdmin(auth)) {
      userId = auth.uid;
    } else {
      // Admin enrolling by email: find or create the target user
      try {
        const existing = await adminAuth.getUserByEmail(email);
        userId = existing.uid;
      } catch {
        isNewUser = true;
        tempPassword = generatePassword();
        const newUser = await adminAuth.createUser({
          email,
          password: tempPassword,
          displayName: nombre,
        });
        userId = newUser.uid;

        await adminDb.collection('users').doc(userId).set({
          email,
          firstName: nombre.split(' ')[0] || nombre,
          lastName: nombre.split(' ').slice(1).join(' ') || '',
          phone: telefono || '',
          role: 'USUARIO',
          institutionId: institutionId || '',
          isActive: true,
          status: 'ACTIVE',
          enrolledCourses: [],
          source: 'admin-enrollment',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // ── 2. Check for duplicate enrollment ────────────────────────────────────
    if (cursoSlug) {
      const existingEnrollment = await adminDb
        .collection('platform_enrollments')
        .where('userId', '==', userId)
        .where('courseSlug', '==', cursoSlug)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!existingEnrollment.empty) {
        return NextResponse.json(
          { error: 'Ya estás inscrito en este curso.', alreadyEnrolled: true },
          { status: 409 },
        );
      }
    }

    // ── 3. Resolve template and cohort ────────────────────────────────────────
    let resolvedTemplateId = templateId;
    let resolvedCohortId = effectiveCohortId;
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

    // ── 4. Create platform enrollment ─────────────────────────────────────────
    const enrollmentRef = adminDb.collection('platform_enrollments').doc();
    await enrollmentRef.set({
      userId,
      email,
      studentName: nombre,
      institutionId: institutionId || auth.institutionId || '',
      templateId: resolvedTemplateId || '',
      cohortId: resolvedCohortId || '',
      courseSlug: cursoSlug,
      courseTitle,
      paymentId: paymentId || null,
      paymentMethod,
      amountPaid,
      enrolledByAdmin: isAdmin(auth) ? auth.uid : null,
      status: 'active',
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: null,
      certificateId: null,
    });

    // ── 5. Atomic cohort increment + automation ───────────────────────────────
    let automationTriggered = false;
    if (resolvedCohortId) {
      try {
        await adminDb.collection('cohorts').doc(resolvedCohortId).update({
          enrolledCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const genResult = await handleCohortFull(adminDb, resolvedCohortId);
        if (genResult?.success && genResult.generatedCohortIds.length > 0) {
          automationTriggered = true;
        }
      } catch (cohortErr) {
        console.warn('[Enrollment] Cohort update skipped:', cohortErr);
      }
    }

    // ── 6. Create transaction record (if no paymentId yet) ───────────────────
    if (!paymentId && isAdmin(auth)) {
      await adminDb.collection('transactions').doc().set({
        reference: `ADMIN-ENROLL-${enrollmentRef.id}`,
        userId,
        enrollmentId: enrollmentRef.id,
        institutionId: institutionId || auth.institutionId || '',
        cohortId: resolvedCohortId || '',
        amountCents: amountPaid * 100,
        currency: 'COP',
        paymentMethod: 'ADMIN_OVERRIDE',
        status: 'APPROVED',
        wompiStatus: 'N/A',
        enrolledByAdmin: auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { source: 'admin-enrollment-api' },
      });
    }

    // ── 7. Legacy: update user.enrolledCourses ────────────────────────────────
    try {
      await adminDb.collection('users').doc(userId).update({
        enrolledCourses: admin.firestore.FieldValue.arrayUnion(cursoSlug),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn('[Enrollment] enrolledCourses update skipped:', e);
    }

    // ── 8. Legacy: enrollment subcollection on course ─────────────────────────
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
              studentName: nombre,
              studentEmail: email,
              enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
              completedModules: 0,
              avgScore: 0,
              sessionCount: 0,
              status: 'active',
              grupoId: resolvedCohortId || '',
            });
          break;
        }
      }
    } catch (legacyErr) {
      console.warn('[Enrollment] Legacy course enrollment skipped:', legacyErr);
    }

    // ── 9. Email notification ─────────────────────────────────────────────────
    try {
      const { NotificationService } = await import('@/services/notification.service');
      await NotificationService.sendEnrollmentConfirmation(
        email,
        nombre,
        courseTitle,
        isNewUser && tempPassword ? tempPassword : undefined,
      );
    } catch (emailErr) {
      console.warn('[Enrollment] Email notification skipped:', emailErr);
    }

    // ── Audit log ─────────────────────────────────────────────────────────────
    await auditLog({
      type: 'enrollment_created',
      userId: auth.uid,
      severity: 'INFO',
      ip,
      metadata: {
        enrolledUserId: userId,
        cursoSlug,
        paymentId: paymentId || 'N/A',
        byAdmin: isAdmin(auth),
        enrollmentId: enrollmentRef.id,
      },
    });

    return NextResponse.json({
      success: true,
      isNewUser,
      userId,
      enrollmentId: enrollmentRef.id,
      automationTriggered,
      ...(isNewUser && tempPassword
        ? {
            credentials: {
              email,
              tempPassword,
              message: 'Cuenta creada en SIERCP. Usa estas credenciales para acceder.',
            },
          }
        : { message: 'Inscripción exitosa. El curso ya aparece en tu cuenta.' }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[API /api/enrollment] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Password Generator ─────────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}
