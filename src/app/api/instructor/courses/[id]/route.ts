import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function verifyInstructor(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No autorizado');
  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userSnap.exists) throw new Error('Usuario no encontrado');
  const user = userSnap.data()!;
  // No se filtra por rol global aquí: un usuario con rol global USUARIO puede ser
  // instructor asignado de un curso vía membership. La autorización real se hace
  // por curso (instructorId/instructorIds o admin de la institución) en GET/PUT.
  return { uid: decoded.uid, user };
}

function ts(d: FirebaseFirestore.DocumentData) {
  const r: Record<string, any> = {};
  for (const [k, v] of Object.entries(d)) {
    r[k] = v && typeof v === 'object' && 'toDate' in v ? v.toDate().toISOString() : v;
  }
  return r;
}

/**
 * ¿El usuario tiene una membership activa de INSTRUCTOR (o ADMIN) en la institución?
 * El instructor se asigna a la institución vía la colección `memberships`.
 */
async function hasInstructorMembership(uid: string, institutionId: string): Promise<boolean> {
  if (!institutionId) return false;
  // Mismo patrón index-safe que el listado (/api/instructor/courses): consultamos
  // solo por userId + isActive (índice ya existente) y filtramos institución/rol en
  // memoria. Así evitamos requerir un índice compuesto userId+institutionId+isActive
  // cuya ausencia hacía fallar la consulta → 500 → "Curso no encontrado".
  const snap = await adminDb
    .collection('memberships')
    .where('userId', '==', uid)
    .where('isActive', '==', true)
    .get();
  return snap.docs.some(d => {
    const m = d.data();
    return m.institutionId === institutionId && ['INSTRUCTOR', 'ADMIN'].includes(m.role);
  });
}

// ─── GET /api/instructor/courses/[id] ─────────────────────────────────────────
// Devuelve: { course, enrollments, sessions, modules }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { uid, user } = await verifyInstructor(req);
    const { id: courseId } = await params;

    // Fetch course
    const courseSnap = await adminDb.collection('courses').doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    const courseData = courseSnap.data()!;

    // Verify access: assigned instructor (instructorId/instructorIds), ADMIN/SUPER_ADMIN,
    // o instructor de la institución vía membership (forma canónica de asignación).
    const isAssigned =
      courseData.instructorId === uid ||
      (Array.isArray(courseData.instructorIds) && courseData.instructorIds.includes(uid));
    const isAdmin =
      ['ADMIN', 'SUPER_ADMIN'].includes(user.role) &&
      (user.role === 'SUPER_ADMIN' || user.institutionId === courseData.institutionId);
    const isMember = isAssigned || isAdmin
      ? true
      : await hasInstructorMembership(uid, courseData.institutionId);

    if (!isAssigned && !isAdmin && !isMember) {
      return NextResponse.json({ error: 'No tienes acceso a este curso' }, { status: 403 });
    }

    // Fetch enrollments, modules, sessions en paralelo. Cada subconsulta es
    // resiliente: un fallo (p.ej. índice compuesto faltante en sessions) no
    // debe tumbar toda la carga del curso.
    const [enrollsSnap, modulesSnap, sessionsSnap] = await Promise.all([
      adminDb.collection('courses').doc(courseId).collection('enrollments').get()
        .catch(() => null),
      adminDb.collection('courses').doc(courseId).collection('modules').orderBy('order').get()
        .catch(() => null),
      // Sin orderBy para no requerir índice compuesto; ordenamos en memoria.
      adminDb.collection('sessions').where('courseId', '==', courseId).limit(200).get()
        .catch(() => null),
    ]);

    const enrollments = enrollsSnap ? enrollsSnap.docs.map(d => ({ id: d.id, ...ts(d.data()) })) : [];
    const modules     = modulesSnap ? modulesSnap.docs.map(d => ({ id: d.id, ...ts(d.data()) })) : [];
    const sessions    = sessionsSnap
      ? sessionsSnap.docs
          .map(d => ({ id: d.id, ...ts(d.data()) }))
          .sort((a: any, b: any) => {
            const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0;
            const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0;
            return tb - ta;
          })
      : [];

    return NextResponse.json({
      course:      { id: courseSnap.id, ...ts(courseData), modules },
      enrollments,
      modules,
      sessions,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg === 'No autorizado' || msg.includes('Acceso denegado') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// ─── PUT /api/instructor/courses/[id] ─────────────────────────────────────────
// Permite al instructor actualizar el curso y sus módulos

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { uid, user } = await verifyInstructor(req);
    const { id: courseId } = await params;
    const body = await req.json();

    const courseSnap = await adminDb.collection('courses').doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    const courseData = courseSnap.data()!;

    const isAssigned =
      courseData.instructorId === uid ||
      (Array.isArray(courseData.instructorIds) && courseData.instructorIds.includes(uid));
    const isAdmin =
      ['ADMIN', 'SUPER_ADMIN'].includes(user.role) &&
      (user.role === 'SUPER_ADMIN' || user.institutionId === courseData.institutionId);
    const isMember = isAssigned || isAdmin
      ? true
      : await hasInstructorMembership(uid, courseData.institutionId);

    if (!isAssigned && !isAdmin && !isMember) {
      return NextResponse.json({ error: 'No tienes acceso a este curso' }, { status: 403 });
    }

    const import_admin = await import('firebase-admin');
    const FieldValue = import_admin.default.firestore.FieldValue;

    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    const allowed = ['title', 'description', 'certification', 'minScore',
                     'inviteCode', 'isActive', 'scenarioMode'];
    for (const f of allowed) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }

    await adminDb.collection('courses').doc(courseId).update(updateData);

    // Rebuild modules subcollection if provided
    if (Array.isArray(body.modules)) {
      const existingSnap = await adminDb.collection('courses').doc(courseId).collection('modules').get();
      const deleteBatch = adminDb.batch();
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      if (body.modules.length > 0) {
        const createBatch = adminDb.batch();
        body.modules.forEach((m: any, i: number) => {
          const ref = adminDb.collection('courses').doc(courseId).collection('modules').doc();
          const cfg: Record<string, any> = {
            passingScore: Number(m.passingScore) || 70,
            questions: [],
            requiredSessions: [],
            topics: Array.isArray(m.topics) ? m.topics.filter(Boolean) : [],
            duration: m.duration || '',
            isRequired: m.isRequired !== false,
            deadlineDate: m.deadlineDate || null,
          };
          if (m.type === 'teoria') {
            if (m.contentType === 'video') cfg.videoUrl = m.contentUrl || '';
            else if (m.contentType === 'pdf') cfg.pdfUrl = m.contentUrl || '';
            else cfg.textContent = m.contentUrl || '';
          } else if (m.type === 'evaluacion_teorica') {
            cfg.textContent = m.contentUrl || '';
          } else if (m.type === 'practica_guiada') {
            cfg.requiredSessions = (m.scenarios || []).map((s: string) => ({
              scenarioId: s, count: 1, minScore: Number(m.passingScore) || 70,
            }));
          }
          createBatch.set(ref, {
            courseId, order: i,
            title: m.title || `Módulo ${i + 1}`,
            type: m.type || 'teoria',
            config: cfg,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        await createBatch.commit();
        await adminDb.collection('courses').doc(courseId).update({
          moduleCount: body.modules.length,
          totalModules: body.modules.length,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
