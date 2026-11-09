/**
 * Supresión de datos de un titular (Ley 1581, art. 8 lit. e y art. 15).
 *
 * Borra el acceso y anonimiza la información personal. Se conservan, sin
 * identificar a la persona, las sesiones y métricas (estadística) y, como
 * prueba ante la SIC, las autorizaciones y la solicitud atendida.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

/** Campos del perfil que identifican a la persona. */
export const PERSONAL_FIELDS = [
  'identification', 'identificacion', 'documentType', 'phoneNumber', 'phone', 'address',
  'city', 'department', 'birthDate', 'avatarUrl', 'bio', 'fcmToken', 'fcmTokens',
  'publicSlug', 'specialty',
] as const;

export function anonymizedProfile(uid: string): Record<string, unknown> {
  const profile: Record<string, unknown> = {
    firstName: 'Usuario',
    lastName: 'eliminado',
    email: `eliminado-${uid}@invalid.sicap`,
    isActive: false,
    status: 'DELETED',
    publicProfile: false,
    deletedAt: FieldValue.serverTimestamp(),
  };
  for (const field of PERSONAL_FIELDS) profile[field] = FieldValue.delete();
  return profile;
}

/** Verificación pública revocada y sin datos de la persona. */
export function revokedVerification(): Record<string, unknown> {
  return {
    status: 'REVOKED',
    revokedReason: 'titular_eliminado',
    userPublicName: FieldValue.delete(),
    userSlug: FieldValue.delete(),
  };
}

export interface EraseResult {
  enrollments: number;
  memberships: number;
  verifications: number;
  authDeleted: boolean;
}

export async function eraseUser(db: Firestore, auth: Auth, uid: string): Promise<EraseResult> {
  await db.collection('users').doc(uid).set(anonymizedProfile(uid), { merge: true });

  const [enrollments, memberships, skills, badges, verifications] = await Promise.all([
    db.collectionGroup('enrollments').where('studentId', '==', uid).get(),
    db.collection('memberships').where('userId', '==', uid).get(),
    db.collection('userSkills').where('userId', '==', uid).get(),
    db.collection('userBadges').where('userId', '==', uid).get(),
    db.collection('skillVerifications').where('userId', '==', uid).get(),
  ]);

  const writes: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [
    ...enrollments.docs.map((d) => (b: FirebaseFirestore.WriteBatch) => b.update(d.ref, {
      studentName: 'Usuario eliminado',
      studentEmail: FieldValue.delete(),
      identification: FieldValue.delete(),
      identificacion: FieldValue.delete(),
    })),
    ...memberships.docs.map((d) => (b: FirebaseFirestore.WriteBatch) => b.update(d.ref, { isActive: false, status: 'removed' })),
    // El perfil público y la verificación de credenciales dejan de mostrar a la persona.
    ...[...skills.docs, ...badges.docs].map((d) => (b: FirebaseFirestore.WriteBatch) => b.update(d.ref, { status: 'REVOKED', revokedReason: 'titular_eliminado' })),
    // La verificación pública es abierta: deja de mostrar el nombre y el perfil.
    ...verifications.docs.map((d) => (b: FirebaseFirestore.WriteBatch) => b.update(d.ref, revokedVerification())),
  ];
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach((write) => write(batch));
    await batch.commit();
  }

  let authDeleted = false;
  try {
    await auth.deleteUser(uid);
    authDeleted = true;
  } catch (e) {
    if ((e as { code?: string }).code === 'auth/user-not-found') authDeleted = true;
    else throw e;
  }
  return { enrollments: enrollments.size, memberships: memberships.size, verifications: verifications.size, authDeleted };
}
