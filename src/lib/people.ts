/**
 * Acceso mínimo a datos de otras personas (Ley 1581 de 2012: finalidad,
 * acceso restringido y circulación restringida).
 *
 * Las reglas de Firestore solo dejan leer perfiles de la propia institución.
 * Lo que necesita cruzar ese límite (inscribir por cédula, ver alumnos de un
 * curso independiente) pasa por aquí: el servidor comprueba la relación y
 * devuelve solo los campos necesarios.
 */
import type { Firestore } from 'firebase-admin/firestore';

export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'] as const;
export const MAX_BATCH = 100;

export interface PersonCard {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  /** Solo para el personal con relación: lo necesita la inscripción. */
  identification?: string | null;
}

export function toCard(uid: string, d: Record<string, unknown>, withIdentification: boolean): PersonCard {
  const card: PersonCard = {
    uid,
    firstName: String(d.firstName ?? ''),
    lastName: String(d.lastName ?? ''),
    email: String(d.email ?? ''),
    role: String(d.role ?? ''),
    avatarUrl: (d.avatarUrl as string | undefined) ?? null,
  };
  if (withIdentification) card.identification = (d.identification ?? d.identificacion ?? null) as string | null;
  return card;
}

/** Normaliza una cédula: solo dígitos y letras, sin puntos ni espacios. */
export function normalizeIdentification(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.replace(/[^0-9A-Za-z]/g, '');
  return clean.length >= 4 && clean.length <= 20 ? clean : null;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) && clean.length <= 254 ? clean : null;
}

/** Instituciones donde el usuario es personal (admin o instructor activo). */
export async function staffInstitutions(db: Firestore, uid: string, institutionId?: string): Promise<string[]> {
  const snap = await db.collection('memberships')
    .where('userId', '==', uid)
    .where('isActive', '==', true)
    .get();
  const ids = new Set<string>();
  for (const m of snap.docs) {
    const d = m.data();
    if (d.status === 'approved' && (d.role === 'ADMIN' || d.role === 'INSTRUCTOR')) ids.add(String(d.institutionId));
  }
  if (institutionId) {
    const inst = await db.collection('institutions').doc(institutionId).get();
    if (inst.exists && inst.data()?.primaryAdminId === uid) ids.add(institutionId);
  }
  return [...ids];
}

/** Cursos que el usuario dicta o creó. */
export async function managedCourses(db: Firestore, uid: string): Promise<string[]> {
  const [single, many, created] = await Promise.all([
    db.collection('courses').where('instructorId', '==', uid).get(),
    db.collection('courses').where('instructorIds', 'array-contains', uid).get(),
    db.collection('courses').where('createdBy', '==', uid).get(),
  ]);
  return [...new Set([...single.docs, ...many.docs, ...created.docs].map((c) => c.id))];
}

export interface Viewer {
  uid: string;
  role: string;
  institutionId?: string;
}

/** ¿Puede este usuario buscar personas por cédula o correo? */
export async function canLookUp(db: Firestore, viewer: Viewer): Promise<boolean> {
  if ((STAFF_ROLES as readonly string[]).includes(viewer.role)) return true;
  if ((await staffInstitutions(db, viewer.uid, viewer.institutionId)).length > 0) return true;
  return (await managedCourses(db, viewer.uid)).length > 0;
}

/**
 * Perfiles que el usuario puede ver: personas de sus instituciones, alumnos de
 * sus cursos y, si es estudiante, los instructores de sus cursos.
 */
export async function visibleProfiles(db: Firestore, viewer: Viewer, ids: string[]): Promise<PersonCard[]> {
  const unique = [...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))].slice(0, MAX_BATCH);
  if (unique.length === 0) return [];

  const refs = unique.map((id) => db.collection('users').doc(id));
  const docs = await db.getAll(...refs);
  if (viewer.role === 'SUPER_ADMIN') {
    return docs.filter((d) => d.exists).map((d) => toCard(d.id, d.data()!, true));
  }

  const institutions = await staffInstitutions(db, viewer.uid, viewer.institutionId);
  const courses = await managedCourses(db, viewer.uid);
  const result: PersonCard[] = [];

  for (const d of docs) {
    if (!d.exists) continue;
    const data = d.data()!;
    if (d.id === viewer.uid) {
      result.push(toCard(d.id, data, true));
      continue;
    }

    const sameInstitution = institutions.includes(String(data.institutionId ?? ''))
      || (await anyApprovedMember(db, d.id, institutions));
    const myStudent = !sameInstitution && (await anyExists(db, courses.map((c) => `courses/${c}/enrollments/${d.id}`)));
    if (sameInstitution || myStudent) {
      result.push(toCard(d.id, data, true));
      continue;
    }

    // Un estudiante ve nombre y foto del instructor de sus cursos, sin datos de contacto.
    const theirCourses = await managedCourses(db, d.id);
    const teachesMe = await anyExists(db, theirCourses.map((c) => `courses/${c}/enrollments/${viewer.uid}`));
    if (teachesMe) result.push({ ...toCard(d.id, data, false), email: '' });
  }
  return result;
}

/** Una invitación sin aceptar no da acceso a los datos de la persona. */
async function anyApprovedMember(db: Firestore, userId: string, institutions: string[]): Promise<boolean> {
  if (institutions.length === 0) return false;
  const snaps = await db.getAll(...institutions.map((i) => db.doc(`memberships/${userId}_${i}`)));
  return snaps.some((s) => s.exists && s.data()?.status === 'approved' && s.data()?.isActive === true);
}

async function anyExists(db: Firestore, paths: string[]): Promise<boolean> {
  if (paths.length === 0) return false;
  const snaps = await db.getAll(...paths.map((p) => db.doc(p)));
  return snaps.some((s) => s.exists);
}

/** Busca por cédula (ambos nombres de campo usados en la app y la web) o correo. */
export async function findPerson(
  db: Firestore,
  query: { identification?: string | null; email?: string | null },
): Promise<PersonCard | null> {
  if (query.identification) {
    for (const field of ['identification', 'identificacion']) {
      const snap = await db.collection('users').where(field, '==', query.identification).limit(1).get();
      if (!snap.empty) return toCard(snap.docs[0].id, snap.docs[0].data(), true);
    }
  }
  if (query.email) {
    const snap = await db.collection('users').where('email', '==', query.email).limit(1).get();
    if (!snap.empty) return toCard(snap.docs[0].id, snap.docs[0].data(), true);
  }
  return null;
}
