import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, isAdmin } from '@/lib/withAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts(d: FirebaseFirestore.DocumentData) {
  const r: Record<string, any> = {};
  for (const [k, v] of Object.entries(d)) {
    r[k] = v && typeof v === 'object' && 'toDate' in v ? v.toDate().toISOString() : v;
  }
  return r;
}

/**
 * Normaliza un documento de módulo de la subcolección `courses/{id}/modules`
 * (formato Flutter con `config`) al shape plano que consume la web del estudiante.
 */
function normalizeModule(id: string, d: any) {
  const cfg = d.config || {};
  return {
    id,
    title: d.title || '',
    type: d.type || 'teoria',
    order: typeof d.order === 'number' ? d.order : 0,
    // Contenido: PDF/texto en contentUrl, video aparte
    contentUrl: cfg.pdfUrl || cfg.textContent || cfg.contentUrl || '',
    videoUrl: cfg.videoUrl || '',
    estimatedMinutes: parseInt(cfg.duration, 10) || 0,
    isRequired: cfg.isRequired !== false,
    passingScore: cfg.passingScore ?? 70,
    topics: Array.isArray(cfg.topics) ? cfg.topics.filter(Boolean) : [],
    scenarios: Array.isArray(cfg.requiredSessions)
      ? cfg.requiredSessions.map((s: any) => s.scenarioId).filter(Boolean)
      : [],
  };
}

// ─── GET /api/student/courses/[id] ────────────────────────────────────────────
// Devuelve: { course, modules, progress: string[] }
// progress = IDs de módulos completados POR ESTE estudiante EN ESTE curso.
// Usa Admin SDK → evita la fragilidad de las reglas Firestore del cliente
// (que es la causa de que los módulos no aparezcan a los estudiantes).

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await withAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id: courseId } = await params;
    if (!courseId) {
      return NextResponse.json({ error: 'ID de curso requerido' }, { status: 400 });
    }

    // Fetch course (por doc id). Si no existe, devolvemos 404 para que el cliente
    // haga fallback al flujo de plataforma (cursos por slug).
    const courseSnap = await adminDb.collection('courses').doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    const courseData = courseSnap.data()!;

    // ── Autorización: el estudiante debe estar inscrito en el curso ───────────
    // Admin/instructor del curso también pueden ver (para previsualizar).
    const enrollSnap = await adminDb
      .collection('courses').doc(courseId)
      .collection('enrollments').doc(auth.uid).get();

    const isEnrolled = enrollSnap.exists;
    const isCourseStaff =
      isAdmin(auth) ||
      courseData.instructorId === auth.uid ||
      (Array.isArray(courseData.instructorIds) && courseData.instructorIds.includes(auth.uid));

    if (!isEnrolled && !isCourseStaff) {
      return NextResponse.json({ error: 'No estás inscrito en este curso' }, { status: 403 });
    }

    // ── Módulos (subcolección canónica) + progreso por curso, en paralelo ─────
    const [modulesSnap, progressSnap] = await Promise.all([
      adminDb.collection('courses').doc(courseId).collection('modules')
        .orderBy('order').get().catch(() => null),
      adminDb.collection('courses').doc(courseId)
        .collection('progress').doc(auth.uid).get().catch(() => null),
    ]);

    const modules = modulesSnap
      ? modulesSnap.docs.map((doc, i) => {
          const m = normalizeModule(doc.id, doc.data());
          // Garantizar orden contiguo si faltara el campo en datos antiguos
          return { ...m, order: m.order || i };
        })
      : [];

    const progress: string[] =
      progressSnap && progressSnap.exists
        ? (progressSnap.data()?.completedModuleIds || progressSnap.data()?.completedModules || [])
        : [];

    return NextResponse.json({
      course: { id: courseSnap.id, ...ts(courseData), moduleCount: modules.length },
      modules,
      progress: Array.isArray(progress) ? progress : [],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
