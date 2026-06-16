import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sanitize, computeNextDeadline } from '@/lib/utils';
import admin from 'firebase-admin';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No autorizado');
  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userSnap.exists) throw new Error('Usuario no encontrado');
  const user = userSnap.data()!;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new Error('Acceso denegado: se requiere rol ADMIN');
  }
  return { uid: decoded.uid, user, institutionId: user.institutionId as string };
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Convierte 'YYYY-MM-DD' (o ISO) a Timestamp; null si vacío/ inválido. */
function parseEndDate(value: unknown): admin.firestore.Timestamp | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value.length === 10 ? `${value}T23:59:59` : value);
  return isNaN(d.getTime()) ? null : admin.firestore.Timestamp.fromDate(d);
}

function serializeTimestamps(d: FirebaseFirestore.DocumentData) {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v && typeof v === 'object' && 'toDate' in v) {
      result[k] = v.toDate().toISOString();
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ─── Mapear ModuleForm → documento Firestore subcolección (formato Flutter) ──

function moduleFormToFirestore(m: any, idx: number, courseId: string) {
  const config: Record<string, any> = {
    passingScore: Number(m.passingScore) || 70,
    questions: [],
    requiredSessions: [],
    topics: Array.isArray(m.topics) ? m.topics.filter(Boolean) : [],
    duration: sanitize(m.duration) || '',
    isRequired: m.isRequired !== false,
    deadlineDate: m.deadlineDate || null,
  };

  if (m.type === 'teoria') {
    const url = sanitize(m.contentUrl) || '';
    if (m.contentType === 'video')  config.videoUrl = url;
    else if (m.contentType === 'pdf') config.pdfUrl = url;
    else config.textContent = url;
  } else if (m.type === 'evaluacion_teorica') {
    config.textContent = sanitize(m.contentUrl) || '';
    config.passingScore = Number(m.passingScore) || 70;
  } else if (m.type === 'practica_guiada') {
    config.requiredSessions = Array.isArray(m.scenarios)
      ? m.scenarios.map((scenarioId: string) => ({
          scenarioId,
          count: 1,
          minScore: Number(m.passingScore) || 70,
        }))
      : [];
  }

  return {
    courseId,
    order: idx,
    title: sanitize(m.title) || `Módulo ${idx + 1}`,
    type: m.type || 'teoria',
    config,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

// ─── Mapear documento Firestore subcolección → ModuleForm (para edición) ─────

function firestoreModuleToForm(docId: string, d: any, idx: number) {
  const cfg = d.config || {};
  const contentUrl = cfg.videoUrl || cfg.pdfUrl || cfg.textContent || '';
  const contentType = cfg.videoUrl ? 'video' : cfg.pdfUrl ? 'pdf' : 'external';
  return {
    id: docId,
    title: d.title || '',
    type: d.type || 'teoria',
    order: d.order ?? idx,
    contentType,
    contentUrl,
    passingScore: cfg.passingScore ?? 70,
    deadlineDate: cfg.deadlineDate || '',
    isRequired: cfg.isRequired !== false,
    topics: Array.isArray(cfg.topics) && cfg.topics.length > 0 ? cfg.topics : [''],
    duration: cfg.duration || '',
    scenarios: Array.isArray(cfg.requiredSessions)
      ? cfg.requiredSessions.map((s: any) => s.scenarioId).filter(Boolean)
      : [],
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────
// GET /api/admin/courses?id={courseId}  → single course + modules
// GET /api/admin/courses                → list all courses for institution

export async function GET(req: NextRequest) {
  try {
    const { institutionId } = await verifyAdmin(req);
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
      const [snap, modulesSnap] = await Promise.all([
        adminDb.collection('courses').doc(id).get(),
        adminDb.collection('courses').doc(id).collection('modules').orderBy('order').get(),
      ]);

      if (!snap.exists) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      }
      const d = snap.data()!;
      if (d.institutionId !== institutionId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      const modules = modulesSnap.docs.map((doc, i) =>
        firestoreModuleToForm(doc.id, serializeTimestamps(doc.data()), i)
      );

      return NextResponse.json({
        course: { id: snap.id, ...serializeTimestamps(d), modules },
      });
    }

    // List all — sin orderBy para evitar requerir índice compuesto
    const snaps = await adminDb
      .collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    // Conteo real de inscritos por curso desde la subcolección enrollments.
    // El contador denormalizado studentCount se desfasa (las inscripciones por
    // QR en Flutter no lo incrementan), así que lo sobreescribimos con el count
    // exacto. El Admin SDK no está sujeto a las reglas de seguridad.
    const courses = await Promise.all(
      snaps.docs.map(async (doc) => {
        let studentCount = (doc.data().studentCount as number) ?? 0;
        try {
          const countSnap = await doc.ref.collection('enrollments').count().get();
          studentCount = countSnap.data().count;
        } catch { /* fallback al valor guardado */ }
        return { id: doc.id, ...serializeTimestamps(doc.data()), studentCount };
      })
    );

    courses.sort((a: any, b: any) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({ courses });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: Create course + modules en subcolección ────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { uid, institutionId } = await verifyAdmin(req);
    const body = await req.json();

    const title = sanitize(body.title);
    if (!title) {
      return NextResponse.json({ error: 'El título del curso es requerido' }, { status: 400 });
    }

    // Get instructor info
    const instructorId = body.instructorId || uid;
    let instructorName = '';
    let instructorEmail = '';
    try {
      const instrSnap = await adminDb.collection('users').doc(instructorId).get();
      if (instrSnap.exists) {
        const u = instrSnap.data()!;
        instructorName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
        instructorEmail = u.email ?? '';
      }
    } catch (_) {}

    // Get institution name
    let institutionName = '';
    try {
      const instSnap = await adminDb.collection('institutions').doc(institutionId).get();
      if (instSnap.exists) institutionName = instSnap.data()?.name ?? '';
    } catch (_) {}

    const rawModules: any[] = Array.isArray(body.modules) ? body.modules : [];
    const validModules = rawModules.filter(m => m.title?.trim());

    // Próxima entrega del curso derivada de las fechas límite de los módulos.
    const { nextDeadline, nextDeadlineTitle } = computeNextDeadline(validModules);

    // Create course document (without modules array)
    const courseData = {
      title,
      description: sanitize(body.description) || '',
      certification: sanitize(body.certification) || 'Certificado de Asistencia',
      institutionId,
      institutionName,
      instructorId,
      instructorName,
      instructorEmail,
      inviteCode: sanitize(body.inviteCode) || generateInviteCode(),
      minScore: Number(body.minScore) || 85,
      minAttendance: Number(body.minAttendance) || 0,
      endDate: parseEndDate(body.endDate),
      moduleCount: validModules.length,
      totalModules: validModules.length,
      nextDeadline,
      nextDeadlineTitle,
      isActive: body.isActive !== false,
      studentCount: 0,
      completedModules: 0,
      guideIds: [],
      requiredGuideCount: 0,
      scenarioMode: 'completo',
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = adminDb.collection('courses').doc();
    await ref.set(courseData);

    // Create modules in subcollection
    if (validModules.length > 0) {
      const batch = adminDb.batch();
      validModules.forEach((m, i) => {
        const modRef = ref.collection('modules').doc();
        batch.set(modRef, moduleFormToFirestore(m, i, ref.id));
      });
      await batch.commit();
    }

    // Pre-enroll students if provided
    const studentIds: string[] = Array.isArray(body.studentIds) ? body.studentIds : [];
    if (studentIds.length > 0) {
      const enrollBatch = adminDb.batch();
      for (const studentId of studentIds) {
        try {
          const userSnap = await adminDb.collection('users').doc(studentId).get();
          if (userSnap.exists) {
            const u = userSnap.data()!;
            const enrollRef = ref.collection('enrollments').doc(studentId);
            enrollBatch.set(enrollRef, {
              studentId,
              studentName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
              studentEmail: u.email ?? '',
              identificacion: u.identification ?? '',
              enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
              completedModules: 0,
              completedModuleIds: [],
              avgScore: 0,
              sessionCount: 0,
              status: 'active',
            });
          }
        } catch (_) {}
      }
      await enrollBatch.commit();
      // Update studentCount
      await ref.update({ studentCount: studentIds.length });
    }

    // Update instructor counter
    try {
      await adminDb.collection('users').doc(instructorId).update({
        coursesCreated: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (_) {}

    return NextResponse.json({ success: true, courseId: ref.id, message: `Curso "${title}" creado` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT: Update course + rebuild modules subcollection ───────────────────────

export async function PUT(req: NextRequest) {
  try {
    const { institutionId } = await verifyAdmin(req);
    const body = await req.json();

    const courseId = sanitize(body.id);
    if (!courseId) {
      return NextResponse.json({ error: 'ID del curso requerido' }, { status: 400 });
    }

    const courseSnap = await adminDb.collection('courses').doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    if (courseSnap.data()?.institutionId !== institutionId) {
      return NextResponse.json({ error: 'No tienes permisos para editar este curso' }, { status: 403 });
    }

    const validModules: any[] = Array.isArray(body.modules)
      ? body.modules.filter((m: any) => m.title?.trim())
      : [];

    // Próxima entrega recalculada desde las fechas límite de los módulos.
    const { nextDeadline, nextDeadlineTitle } = computeNextDeadline(validModules);

    // Update course metadata
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      moduleCount: validModules.length,
      totalModules: validModules.length,
      nextDeadline,
      nextDeadlineTitle,
    };

    const allowedFields = [
      'title', 'description', 'certification', 'minScore', 'inviteCode',
      'isActive', 'instructorId',
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }
    // Gating de asistencia + fecha final (Fase 2/3).
    if (body.minAttendance !== undefined) updateData.minAttendance = Number(body.minAttendance) || 0;
    if (body.endDate !== undefined) {
      updateData.endDate = parseEndDate(body.endDate);
      // Si cambia la fecha final, permitir que el cron vuelva a procesar.
      updateData.certsGeneratedAt = admin.firestore.FieldValue.delete();
    }

    await adminDb.collection('courses').doc(courseId).update(updateData);

    // Rebuild modules subcollection: delete all existing, then recreate
    const existingSnap = await adminDb
      .collection('courses').doc(courseId).collection('modules').get();

    if (!existingSnap.empty) {
      const deleteBatch = adminDb.batch();
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    if (validModules.length > 0) {
      const createBatch = adminDb.batch();
      validModules.forEach((m, i) => {
        const modRef = adminDb.collection('courses').doc(courseId).collection('modules').doc();
        createBatch.set(modRef, moduleFormToFirestore(m, i, courseId));
      });
      await createBatch.commit();
    }

    return NextResponse.json({ success: true, message: 'Curso actualizado' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE: Deactivate course ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { institutionId } = await verifyAdmin(req);
    const courseId = req.nextUrl.searchParams.get('id');

    if (!courseId) {
      return NextResponse.json({ error: 'ID del curso requerido' }, { status: 400 });
    }

    const courseSnap = await adminDb.collection('courses').doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    if (courseSnap.data()?.institutionId !== institutionId) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    await adminDb.collection('courses').doc(courseId).update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Curso desactivado' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
