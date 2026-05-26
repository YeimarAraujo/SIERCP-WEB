/**
 * GET /api/debug/all-platform
 *
 * Diagnostic endpoint: shows all platform_enrollments, cohorts, templates, transactions.
 * PROTECTED: SUPER_ADMIN only in development. Returns 404 in production (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  // Double-fence: middleware blocks in production, this guard blocks non-SUPER_ADMIN in dev
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const auth = await withAuth(req, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) {
    await auditLog({
      type: 'debug_access_blocked',
      severity: 'WARN',
      ip: getClientIp(req),
      metadata: { endpoint: '/api/debug/all-platform', reason: 'unauthorized' },
    });
    return auth;
  }

  const results: Record<string, unknown> = {};

  // 1. ALL platform_enrollments
  try {
    const snap = await adminDb.collection('platform_enrollments').get();
    results.platform_enrollments = {
      total: snap.size,
      docs: snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          email: data.email,
          studentName: data.studentName,
          courseSlug: data.courseSlug,
          courseTitle: data.courseTitle,
          cohortId: data.cohortId,
          institutionId: data.institutionId,
          status: data.status,
          paymentMethod: data.paymentMethod,
          amountPaid: data.amountPaid,
          enrolledAt: data.enrolledAt?.toDate?.()?.toISOString() || null,
        };
      }),
    };
  } catch (e: unknown) {
    results.platform_enrollments_error = e instanceof Error ? e.message : String(e);
  }

  // 2. ALL cohorts
  try {
    const snap = await adminDb.collection('cohorts').get();
    results.cohorts = {
      total: snap.size,
      docs: snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          courseSlug: data.courseSlug,
          courseTitle: data.courseTitle,
          institutionId: data.institutionId,
          status: data.status,
          classesStart: data.classesStart?.toDate?.()?.toISOString() || null,
          enrolledCount: data.enrolledCount,
          maxStudents: data.maxStudents,
        };
      }),
    };
  } catch (e: unknown) {
    results.cohorts_error = e instanceof Error ? e.message : String(e);
  }

  // 3. ALL course_templates
  try {
    const snap = await adminDb.collection('course_templates').get();
    results.course_templates = {
      total: snap.size,
      docs: snap.docs.map(d => ({
        id: d.id,
        slug: d.data().slug,
        title: d.data().title,
        institutionId: d.data().institutionId,
        isActive: d.data().isActive,
      })),
    };
  } catch (e: unknown) {
    results.course_templates_error = e instanceof Error ? e.message : String(e);
  }

  // 4. ALL transactions
  try {
    const snap = await adminDb.collection('transactions').get();
    results.transactions = {
      total: snap.size,
      docs: snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          status: data.status || data.wompiStatus,
          amountCents: data.amountCents || data.amount_in_cents,
          enrollmentId: data.enrollmentId,
          reference: data.reference,
          cursoSlug: data.curso_slug,
        };
      }),
    };
  } catch (e: unknown) {
    results.transactions_error = e instanceof Error ? e.message : String(e);
  }

  // 5. ALL legacy courses
  try {
    const snap = await adminDb.collection('courses').get();
    results.legacy_courses = {
      total: snap.size,
      docs: snap.docs.map(d => ({
        id: d.id,
        title: d.data().title,
        slug: d.data().slug,
      })),
    };
  } catch (e: unknown) {
    results.legacy_courses_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results, { status: 200 });
}
