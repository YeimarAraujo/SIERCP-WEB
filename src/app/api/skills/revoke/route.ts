import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { recomputeUserSkillAggregates } from '@/lib/skill-engine';

/**
 * POST /api/skills/revoke  (Spark — reemplaza la CF revokeSkill)
 *
 * Revoca una skill emitida. Auth: session cookie (panel admin/SA).
 * Permitido a SUPER_ADMIN o al ADMIN de la institución emisora.
 * Nunca borra: marca REVOKED en userSkills + skillVerifications + audit_logs.
 *
 * Body: { userSkillId: string, reason?: string }
 */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const c = await cookies();
  const session = c.get('session')?.value;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let callerUid: string;
  let isSuper = false;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    callerUid = decoded.uid;
    isSuper = decoded['isSuperAdmin'] === true;
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { userSkillId?: string; reason?: string } | null;
  if (!body?.userSkillId) return NextResponse.json({ error: 'userSkillId requerido' }, { status: 400 });

  const ref = adminDb.doc(`userSkills/${body.userSkillId}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Skill no encontrada' }, { status: 404 });
  const us = snap.data()!;

  // Permisos: SUPER_ADMIN o ADMIN primario de la institución emisora.
  let allowed = isSuper;
  const issuerInst = us.issuedByInstitutionId as string | null;
  if (!allowed && issuerInst) {
    const inst = await adminDb.collection('institutions').doc(issuerInst).get();
    allowed = inst.data()?.primaryAdminId === callerUid;
  }
  if (!allowed) return NextResponse.json({ error: 'Sin permiso para revocar esta skill' }, { status: 403 });

  const now = admin.firestore.Timestamp.now();
  const code = us.skillCode as string;
  const batch = adminDb.batch();
  batch.update(ref, { status: 'REVOKED', revokedReason: body.reason ?? null, revokedAt: now, revokedBy: callerUid, updatedAt: now });
  if (code) batch.set(adminDb.doc(`skillVerifications/${code}`), { status: 'REVOKED' }, { merge: true });
  batch.set(adminDb.collection('audit_logs').doc(), {
    action: 'SKILL_REVOKED', actorUid: callerUid, targetUserId: us.userId,
    userSkillId: body.userSkillId, skillCode: code ?? null, reason: body.reason ?? null, createdAt: now,
  });
  await batch.commit();

  await recomputeUserSkillAggregates(us.userId as string);
  return NextResponse.json({ success: true });
}
