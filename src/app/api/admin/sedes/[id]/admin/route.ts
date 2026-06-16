/**
 * PUT /api/admin/sedes/[id]/admin — Asigna (o cambia) el admin de una sede.
 *
 * Establece el vínculo AUTORITATIVO usuario↔sede que el scoping necesita:
 *   - sedes/{id}.adminId / adminName
 *   - users/{uid}.sedeId            (denormalizado para lecturas/paneles)
 *   - memberships/{uid_inst}.sedeId (scope de la membership)
 * Si había un admin anterior, le limpia el sedeId (deja de ser admin de sede).
 *
 * Auth: ADMIN de la institución de la sede (admin principal) o SUPER_ADMIN.
 * Body: { userId: string }   // usuario a asignar como admin de la sede
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await withAuth(req, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const { id: sedeId } = await params;

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }
  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  const sedeSnap = await adminDb.collection('sedes').doc(sedeId).get();
  if (!sedeSnap.exists) {
    return NextResponse.json({ error: 'Sede no encontrada' }, { status: 404 });
  }
  const sede = sedeSnap.data()!;
  const institutionId = sede.institutionId as string;

  // El ADMIN solo puede gestionar sedes de SU institución (el SUPER_ADMIN, cualquiera).
  if (auth.role !== 'SUPER_ADMIN' && auth.institutionId !== institutionId) {
    return NextResponse.json({ error: 'No autorizado sobre esta sede.' }, { status: 403 });
  }

  // El usuario objetivo debe pertenecer a la misma institución.
  const targetSnap = await adminDb.collection('users').doc(userId).get();
  if (!targetSnap.exists) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }
  const target = targetSnap.data()!;
  if (target.institutionId !== institutionId) {
    return NextResponse.json(
      { error: 'El usuario no pertenece a esta institución.' },
      { status: 400 },
    );
  }

  const now = FieldValue.serverTimestamp();
  const adminName =
    target.displayName ||
    [target.firstName, target.lastName].filter(Boolean).join(' ') ||
    target.email;

  const batch = adminDb.batch();

  // 1. Limpiar el sedeId del admin anterior (si existía y es distinto).
  const prevAdminId = sede.adminId as string | undefined;
  if (prevAdminId && prevAdminId !== userId) {
    batch.set(
      adminDb.collection('users').doc(prevAdminId),
      { sedeId: FieldValue.delete(), updatedAt: now },
      { merge: true },
    );
    batch.set(
      adminDb.collection('memberships').doc(`${prevAdminId}_${institutionId}`),
      { sedeId: FieldValue.delete(), updatedAt: now },
      { merge: true },
    );
  }

  // 2. Sede → nuevo admin.
  batch.set(
    adminDb.collection('sedes').doc(sedeId),
    { adminId: userId, adminName, updatedAt: now },
    { merge: true },
  );

  // 3. Vínculo autoritativo en user + membership.
  batch.set(
    adminDb.collection('users').doc(userId),
    { sedeId, updatedAt: now },
    { merge: true },
  );
  batch.set(
    adminDb.collection('memberships').doc(`${userId}_${institutionId}`),
    { userId, institutionId, sedeId, updatedAt: now },
    { merge: true },
  );

  await batch.commit();

  return NextResponse.json({ success: true, adminId: userId, adminName });
}
