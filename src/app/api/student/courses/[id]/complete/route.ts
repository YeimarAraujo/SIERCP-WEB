import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import admin from 'firebase-admin';

// ─── POST /api/student/courses/[id]/complete ──────────────────────────────────
// Body: { moduleId: string }
// Marca un módulo como completado para ESTE estudiante EN ESTE curso.
// El progreso vive en courses/{id}/progress/{studentId} → estrictamente por curso,
// nunca se filtra a otros cursos. Además notifica al instructor del curso.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await withAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id: courseId } = await params;
    const body = await req.json().catch(() => ({}));
    const moduleId = typeof body.moduleId === 'string' ? body.moduleId.trim() : '';

    if (!courseId || !moduleId) {
      return NextResponse.json({ error: 'courseId y moduleId son requeridos' }, { status: 400 });
    }

    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    const courseData = courseSnap.data()!;

    // El estudiante debe estar inscrito.
    const enrollRef = courseRef.collection('enrollments').doc(auth.uid);
    const enrollSnap = await enrollRef.get();
    if (!enrollSnap.exists) {
      return NextResponse.json({ error: 'No estás inscrito en este curso' }, { status: 403 });
    }

    // Validar que el módulo pertenece a este curso (evita marcar módulos de otro curso).
    const moduleSnap = await courseRef.collection('modules').doc(moduleId).get();
    if (!moduleSnap.exists) {
      return NextResponse.json({ error: 'Módulo no encontrado en este curso' }, { status: 404 });
    }

    const FieldValue = admin.firestore.FieldValue;

    // ── Marcar completado (por curso) ─────────────────────────────────────────
    const progressRef = courseRef.collection('progress').doc(auth.uid);
    const progressSnap = await progressRef.get();
    const already: string[] = progressSnap.exists
      ? (progressSnap.data()?.completedModuleIds || [])
      : [];
    const alreadyDone = already.includes(moduleId);

    await progressRef.set({
      studentId: auth.uid,
      courseId,
      completedModuleIds: FieldValue.arrayUnion(moduleId),
      lastAccessedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    const completedCount = alreadyDone ? already.length : already.length + 1;

    // ── Reflejar conteo en el enrollment (para el panel del instructor) ───────
    await enrollRef.set({
      completedModuleIds: FieldValue.arrayUnion(moduleId),
      completedModules: completedCount,
      lastActivityAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // ── Notificar al instructor (solo la primera vez que se completa) ─────────
    if (!alreadyDone) {
      try {
        const instructorId = courseData.instructorId;
        const studentName =
          enrollSnap.data()?.studentName ||
          `${auth.email || 'Un estudiante'}`;
        const moduleTitle = moduleSnap.data()?.title || 'un módulo';

        if (instructorId && instructorId !== auth.uid) {
          await adminDb.collection('notifications').doc().set({
            userId: instructorId,
            title: 'Módulo completado',
            message: `${studentName} completó "${moduleTitle}" en ${courseData.title || 'tu curso'}.`,
            type: 'success',
            icon: 'CheckCircle',
            courseId,
            studentId: auth.uid,
            moduleId,
            isRead: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      } catch (notifyErr) {
        // No bloquear la finalización del módulo si la notificación falla.
        console.warn('[student/complete] Notificación al instructor omitida:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      moduleId,
      completedModules: completedCount,
      alreadyCompleted: alreadyDone,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
