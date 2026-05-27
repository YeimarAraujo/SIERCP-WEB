/**
 * GET /api/debug/enrollments?userId=xxx
 *
 * Diagnostic: shows all enrollment docs for a specific user.
 * PROTECTED: SUPER_ADMIN only in development. Returns 404 in production.
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const auth = await withAuth(req, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) {
    await auditLog({
      type: 'debug_access_blocked',
      severity: 'WARN',
      ip: getClientIp(req),
      metadata: { endpoint: '/api/debug/enrollments', reason: 'unauthorized' },
    });
    return auth;
  }

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  // 1. platform_enrollments for userId
  try {
    const platformSnap = await adminDb.collection('platform_enrollments')
      .where('userId', '==', userId)
      .get();

    results.platform_enrollments = {
      count: platformSnap.size,
      docs: platformSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        enrolledAt: d.data().enrolledAt?.toDate?.()?.toISOString() || d.data().enrolledAt,
      })),
    };
  } catch (e: unknown) {
    results.platform_enrollments_error = e instanceof Error ? e.message : String(e);
  }

  // 2. Legacy enrollments
  try {
    const coursesSnap = await adminDb.collection('courses')
      .where('isActive', '==', true)
      .get();

    const legacyEnrollments: unknown[] = [];
    for (const courseDoc of coursesSnap.docs) {
      const enrollSnap = await adminDb
        .collection('courses').doc(courseDoc.id)
        .collection('enrollments').doc(userId)
        .get();
      if (enrollSnap.exists) {
        legacyEnrollments.push({
          courseId: courseDoc.id,
          courseTitle: courseDoc.data().title,
          enrollment: enrollSnap.data(),
        });
      }
    }

    results.legacy_enrollments = {
      totalCourses: coursesSnap.size,
      enrolledIn: legacyEnrollments,
    };
  } catch (e: unknown) {
    results.legacy_enrollments_error = e instanceof Error ? e.message : String(e);
  }

  // 3. User doc
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const data = userDoc.data()!;
      results.user = {
        email: data.email,
        role: data.role,
        enrolledCourses: data.enrolledCourses || [],
        institutionId: data.institutionId || null,
      };
    } else {
      results.user = 'NOT_FOUND';
    }
  } catch (e: unknown) {
    results.user_error = e instanceof Error ? e.message : String(e);
  }

  // 4. Cohorts (all)
  try {
    const cohortsSnap = await adminDb.collection('cohorts').get();
    results.cohorts = {
      count: cohortsSnap.size,
      docs: cohortsSnap.docs.map(d => ({
        id: d.id,
        courseSlug: d.data().courseSlug,
        courseTitle: d.data().courseTitle,
        status: d.data().status,
        classesStart: d.data().classesStart?.toDate?.()?.toISOString() || null,
        enrolledCount: d.data().enrolledCount,
      })),
    };
  } catch (e: unknown) {
    results.cohorts_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results, { status: 200 });
}
