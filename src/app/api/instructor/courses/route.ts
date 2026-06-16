import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function verifyUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No autorizado');
  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userSnap.exists) throw new Error('Usuario no encontrado');
  return { uid: decoded.uid, user: userSnap.data()! };
}

function ts(d: FirebaseFirestore.DocumentData) {
  const r: Record<string, any> = {};
  for (const [k, v] of Object.entries(d)) {
    r[k] = v && typeof v === 'object' && 'toDate' in v ? v.toDate().toISOString() : v;
  }
  return r;
}

// ─── GET /api/instructor/courses ──────────────────────────────────────────────
// Lista los cursos que el usuario puede gestionar como instructor:
//   1) Cursos donde es instructor directo (instructorId / instructorIds).
//   2) Cursos de las instituciones donde tiene membership INSTRUCTOR/ADMIN activa.
// La asignación instructor↔institución vive en la colección `memberships`.

export async function GET(req: NextRequest) {
  try {
    const { uid } = await verifyUser(req);

    // 1) Instituciones donde el usuario es INSTRUCTOR/ADMIN (vía memberships)
    const memSnap = await adminDb
      .collection('memberships')
      .where('userId', '==', uid)
      .where('isActive', '==', true)
      .get();

    const institutionIds = Array.from(new Set(
      memSnap.docs
        .filter(d => ['INSTRUCTOR', 'ADMIN'].includes(d.data().role))
        .map(d => d.data().institutionId as string)
        .filter(Boolean)
    ));

    // 2) Cursos por instructor directo + por institución, en paralelo
    const queries: Promise<FirebaseFirestore.QuerySnapshot>[] = [
      adminDb.collection('courses').where('instructorId', '==', uid).get(),
      adminDb.collection('courses').where('instructorIds', 'array-contains', uid).get(),
    ];

    // Firestore permite hasta 10 valores en 'in'. Particionamos por seguridad.
    for (let i = 0; i < institutionIds.length; i += 10) {
      const chunk = institutionIds.slice(i, i + 10);
      if (chunk.length > 0) {
        queries.push(
          adminDb.collection('courses').where('institutionId', 'in', chunk).get()
        );
      }
    }

    const snaps = await Promise.all(queries);

    // Dedupe por id (conservando la referencia para el conteo de inscritos)
    const byId = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const snap of snaps) {
      for (const doc of snap.docs) {
        if (!byId.has(doc.id)) byId.set(doc.id, doc);
      }
    }

    // Conteo real de inscritos desde la subcolección enrollments (el contador
    // denormalizado studentCount se desfasa: las inscripciones por QR en Flutter
    // no lo incrementan). El Admin SDK no está sujeto a las reglas de seguridad.
    const courses = await Promise.all(
      Array.from(byId.values()).map(async (doc) => {
        let studentCount = (doc.data().studentCount as number) ?? 0;
        try {
          const countSnap = await doc.ref.collection('enrollments').count().get();
          studentCount = countSnap.data().count;
        } catch { /* fallback al valor guardado */ }
        return { id: doc.id, ...ts(doc.data()), studentCount };
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
    const status = msg === 'No autorizado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
