import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/admin/delete-user  (Spark — reemplaza la CF deleteAuthUser)
 *
 * ADMIN/SUPER_ADMIN elimina un usuario: soft-delete en Firestore + memberships
 * inactivas + borrado DURO de la cuenta de Firebase Auth + audit.
 * La app ya hace el soft-delete client-side; esta ruta lo hace autoritativo e
 * idempotente y ejecuta el borrado de Auth (que requiere Admin SDK).
 *
 * Auth: Authorization: Bearer <ID token>. Body: { targetUid }
 */
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization') ?? '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let callerUid: string;
  try {
    callerUid = (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { targetUid?: string } | null;
  const targetUid = body?.targetUid;
  if (!targetUid) return NextResponse.json({ error: 'targetUid requerido' }, { status: 400 });
  if (callerUid === targetUid) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo.' }, { status: 400 });

  // Permisos del caller (desde Firestore, nunca del token).
  const callerSnap = await adminDb.collection('users').doc(callerUid).get();
  const callerRole = callerSnap.data()?.role as string | undefined;
  if (callerRole !== 'ADMIN' && callerRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Solo admins pueden eliminar usuarios.' }, { status: 403 });
  }

  const targetSnap = await adminDb.collection('users').doc(targetUid).get();
  if (!targetSnap.exists) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  if (targetSnap.data()?.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No se puede eliminar un SuperAdmin.' }, { status: 403 });
  }

  // ADMIN: solo usuarios de sus organizaciones.
  if (callerRole === 'ADMIN') {
    const [callerM, targetM] = await Promise.all([
      adminDb.collection('memberships').where('userId', '==', callerUid).where('isActive', '==', true).where('role', '==', 'ADMIN').get(),
      adminDb.collection('memberships').where('userId', '==', targetUid).where('isActive', '==', true).get(),
    ]);
    const callerOrgs = new Set(callerM.docs.map((d) => d.data().institutionId as string));
    const shared = targetM.docs.some((d) => callerOrgs.has(d.data().institutionId as string));
    if (!shared) return NextResponse.json({ error: 'El usuario no pertenece a tus organizaciones.' }, { status: 403 });
  }

  // Soft-delete Firestore + memberships inactivas.
  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = adminDb.batch();
  batch.update(adminDb.collection('users').doc(targetUid), {
    isActive: false, accountStatus: 'deleted', deletedAt: now, deletedBy: callerUid,
  });
  const memberships = await adminDb.collection('memberships').where('userId', '==', targetUid).where('isActive', '==', true).get();
  memberships.forEach((m) => batch.update(m.ref, { isActive: false }));
  await batch.commit();

  // Borrado DURO de Auth (idempotente).
  try {
    await adminAuth.deleteUser(targetUid);
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') {
      console.error('[delete-user] auth delete', err);
    }
  }

  await adminDb.collection('audit_logs').add({
    action: 'deleteUser', targetUid, callerUid, createdAt: admin.firestore.Timestamp.now(),
  });

  return NextResponse.json({ success: true });
}
