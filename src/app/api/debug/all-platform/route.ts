/**
 * GET /api/debug/all-platform
 * 
 * TEMPORAL — Muestra TODOS los platform_enrollments y cohorts que existen.
 * ELIMINAR antes de producción.
 */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
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
  } catch (e: any) {
    results.platform_enrollments_error = e.message;
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
  } catch (e: any) {
    results.cohorts_error = e.message;
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
  } catch (e: any) {
    results.course_templates_error = e.message;
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
  } catch (e: any) {
    results.transactions_error = e.message;
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
  } catch (e: any) {
    results.legacy_courses_error = e.message;
  }

  return NextResponse.json(results, { status: 200 });
}
