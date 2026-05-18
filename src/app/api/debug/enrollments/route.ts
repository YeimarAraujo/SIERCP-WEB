/**
 * GET /api/debug/enrollments?userId=xxx
 * 
 * TEMPORAL — Endpoint de diagnóstico para verificar qué documentos
 * existen en platform_enrollments y courses/enrollments para un usuario.
 * ELIMINAR antes de producción.
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  // 1. Check platform_enrollments
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
  } catch (e: any) {
    results.platform_enrollments_error = e.message;
  }

  // 2. Check legacy courses with enrollments subcollection
  try {
    const coursesSnap = await adminDb.collection('courses')
      .where('isActive', '==', true)
      .get();
    
    const legacyEnrollments: any[] = [];
    
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
  } catch (e: any) {
    results.legacy_enrollments_error = e.message;
  }

  // 3. Check user doc
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
  } catch (e: any) {
    results.user_error = e.message;
  }

  // 4. Check cohorts
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
  } catch (e: any) {
    results.cohorts_error = e.message;
  }

  return NextResponse.json(results, { status: 200 });
}
