import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sanitize, isValidEmail } from '@/lib/utils';
import { handleCohortFull } from '@/lib/automation-engine';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import admin from 'firebase-admin';

/**
 * POST /api/enrollment
 *
 * Handles course enrollment after payment approval.
 * This is the UPGRADED version that:
 *   1. Creates/validates the user
 *   2. Creates a platform enrollment record
 *   3. Atomically increments cohort.enrolledCount
 *   4. Creates a financial transaction record
 *   5. Triggers automation if the cohort becomes FULL
 *   6. Updates legacy user.enrolledCourses for backward compatibility
 */
export async function POST(req: NextRequest) {
  try {
    /* Rate limiting: máximo 10 inscripciones por IP cada 10 minutos */
    const ip = getClientIp(req);
    const rl = rateLimiter.check(`enrollment:${ip}`, { max: 10, windowMs: 600_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    const body = await req.json();

    // ─── Sanitize inputs ───────────────────────────────────────────────────
    const email = sanitize(body.email);
    const nombre = sanitize(body.nombre);
    const telefono = sanitize(body.telefono);
    const cursoSlug = sanitize(body.cursoSlug);
    const cohortId = sanitize(body.cohortId);
    const templateId = sanitize(body.templateId);
    const institutionId = sanitize(body.institutionId);
    const paymentId = sanitize(body.paymentId);
    const paymentMethod = sanitize(body.paymentMethod) || 'CARD';
    const amountPaid = Number(body.amountPaid) || 0;

    // Legacy field — keep backward compatibility
    const grupoId = sanitize(body.grupoId);

    // ─── Validate required fields ──────────────────────────────────────────
    if (!email || !nombre || !cursoSlug) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (email, nombre, cursoSlug)' },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // ─── Resolve cohort (new system) or grupo (legacy) ─────────────────────
    const effectiveCohortId = cohortId || grupoId;

    // ─── 1. Create or find user ────────────────────────────────────────────
    let userId: string;
    let isNewUser = false;
    let tempPassword: string | null = null;

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
        source: 'web-enrollment',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ─── 2. Check for duplicate enrollment ─────────────────────────────────
    if (cursoSlug) {
      const existingEnrollment = await adminDb.collection('platform_enrollments')
        .where('userId', '==', userId)
        .where('courseSlug', '==', cursoSlug)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!existingEnrollment.empty) {
        return NextResponse.json(
          { error: 'Ya estás inscrito en este grupo', alreadyEnrolled: true },
          { status: 409 },
        );
      }
    }

    // ─── 3. Resolve template and cohort if missing ─────────────────────────────
    let resolvedTemplateId = templateId;
    let resolvedCohortId = effectiveCohortId;
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

    // ─── 4. Create platform enrollment ─────────────────────────────────────
    const enrollmentRef = adminDb.collection('platform_enrollments').doc();
    await enrollmentRef.set({
      userId,
      email,
      studentName: nombre,
      institutionId: institutionId || '',
      templateId: resolvedTemplateId || '',
      cohortId: resolvedCohortId || '',
      courseSlug: cursoSlug,
      courseTitle,
      paymentId: paymentId || null,
      paymentMethod,
      amountPaid,
      status: 'active',
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: null,
      certificateId: null,
    });

    // ─── 5. Atomic increment of cohort enrolled count ──────────────────────
    let automationTriggered = false;
    if (resolvedCohortId) {
      try {
        const cohortRef = adminDb.collection('cohorts').doc(resolvedCohortId);
        await cohortRef.update({
          enrolledCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Check if the cohort is now full → trigger automation
        const genResult = await handleCohortFull(adminDb, effectiveCohortId);
        if (genResult?.success && genResult.generatedCohortIds.length > 0) {
          automationTriggered = true;
          console.log(
            `[Enrollment] Automation triggered: generated ${genResult.generatedCohortIds.length} new cohort(s)`,
          );
        }
      } catch (cohortErr) {
        // Non-fatal: cohort may not exist in new system yet (legacy groups)
        console.warn('[Enrollment] Cohort update skipped:', cohortErr);
      }
    }

    // ─── 6. Create financial transaction record ────────────────────────────
    if (paymentId) {
      await adminDb.collection('transactions').doc().set({
        wompiTransactionId: paymentId,
        reference: body.reference || '',
        userId,
        enrollmentId: enrollmentRef.id,
        institutionId: institutionId || '',
        cohortId: effectiveCohortId || '',
        amountCents: amountPaid * 100,
        currency: 'COP',
        paymentMethod,
        status: 'APPROVED',
        wompiStatus: 'APPROVED',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { source: 'enrollment-api' },
      });
    }

    // ─── 7. Legacy: update user.enrolledCourses ────────────────────────────
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const courses = userDoc.data()?.enrolledCourses || [];
    if (!courses.includes(cursoSlug)) {
      await userRef.update({
        enrolledCourses: admin.firestore.FieldValue.arrayUnion(cursoSlug),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ─── 8. Legacy: create enrollment subcollection on course ───────────────
    // Keep backward compatibility with the existing CourseService
    try {
      const coursesSnap = await adminDb.collection('courses')
        .where('isActive', '==', true)
        .get();

      for (const courseDoc of coursesSnap.docs) {
        const courseData = courseDoc.data();
        if (courseData.inviteCode || courseData.title) {
          // Match by slug-like patterns in the legacy course collection
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
                grupoId: effectiveCohortId || '',
              });
            break;
          }
        }
      }
    } catch (legacyErr) {
      console.warn('[Enrollment] Legacy course enrollment skipped:', legacyErr);
    }

    // ─── 9. Send email notification ─────────────────────────────────────────
    try {
      const { NotificationService } = await import('@/services/notification.service');
      await NotificationService.sendEnrollmentConfirmation(
        email,
        nombre,
        courseTitle,
        isNewUser && tempPassword ? tempPassword : undefined
      );
    } catch (emailErr) {
      console.warn('[Enrollment] Failed to send notification email:', emailErr);
    }

    // ─── Response ──────────────────────────────────────────────────────────
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
        : {
            message: 'Inscripción exitosa. El curso ya aparece en tu cuenta.',
          }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[API /api/enrollment] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Password Generator ─────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}
