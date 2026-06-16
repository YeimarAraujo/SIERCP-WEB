import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ensurePublicSlug } from '@/lib/skill-engine';

/**
 * POST /api/skills/public-profile  (Spark — reemplaza la CF setPublicProfile)
 *
 * Opt-in del Skill Passport público. La app Flutter lo llama con el ID token.
 * Privacidad: el perfil es privado por defecto.
 *
 * Auth: Authorization: Bearer <Firebase ID token>.
 * Body: { enabled: boolean }
 * Returns: { success, publicProfile, publicSlug }
 */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization') ?? '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { enabled?: boolean } | null;
  const enabled = body?.enabled === true;

  const userRef = adminDb.collection('users').doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const slug = await ensurePublicSlug(uid, snap.data()!);
  await userRef.set(
    { publicProfile: enabled, updatedAt: admin.firestore.Timestamp.now() },
    { merge: true }
  );

  return NextResponse.json({ success: true, publicProfile: enabled, publicSlug: slug });
}
