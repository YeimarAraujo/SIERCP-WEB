import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { evaluateAndIssue, updateSessionStats, type Evidence } from '@/lib/skill-engine';

/**
 * POST /api/skills/evaluate  (Spark — reemplaza el trigger onSessionCompleted)
 *
 * La app Flutter llama a este endpoint tras completar una sesión RCP. El score
 * se lee del documento de sesión en el SERVIDOR (no se confía en el cliente).
 *
 * Auth: Authorization: Bearer <Firebase ID token>.
 * Body: { sessionId: string }
 */

export const dynamic = 'force-dynamic';

function normalizePatientType(raw: unknown): 'ADULT' | 'CHILD' | 'INFANT' {
  const s = String(raw ?? '').toLowerCase();
  if (/(infant|lactante|bebe|bebé|neonat)/.test(s)) return 'INFANT';
  if (/(child|niñ|nin|pedia|pediátr|pediatr)/.test(s)) return 'CHILD';
  return 'ADULT';
}

export async function POST(req: NextRequest) {
  // 1. Verificar ID token
  const authz = req.headers.get('authorization') ?? '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { sessionId?: string } | null;
  if (!body?.sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });

  // 2. Leer la sesión en el servidor (score autoritativo)
  const snap = await adminDb.collection('sessions').doc(body.sessionId).get();
  if (!snap.exists) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
  const s = snap.data()!;

  if (s.studentId !== uid) return NextResponse.json({ error: 'No es tu sesión' }, { status: 403 });
  if (s.status !== 'completed') return NextResponse.json({ error: 'Sesión no completada' }, { status: 409 });

  const score = (s.metrics?.qualityScore ?? s.metrics?.score ?? 0) as number;
  const evidence: Evidence = {
    type: 'TELEMETRY',
    ref: body.sessionId,
    score,
    capturedAt: admin.firestore.Timestamp.now(),
    patientType: normalizePatientType(s.patientType),
  };

  try {
    // 1. Stats/XP/leaderboard de la sesión (re-aloja onSessionCompleted; idempotente).
    await updateSessionStats(uid, body.sessionId, s);
    // 2. Emisión de skills con evidencia de telemetría.
    const issued = await evaluateAndIssue(uid, evidence);
    return NextResponse.json({ success: true, issued });
  } catch (e) {
    console.error('[skills/evaluate]', e);
    return NextResponse.json({ error: 'Error al evaluar skills' }, { status: 500 });
  }
}
