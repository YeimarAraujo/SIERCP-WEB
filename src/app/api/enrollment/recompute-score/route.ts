/**
 * POST /api/enrollment/recompute-score
 *
 * Recalcula la nota AUTORITATIVA (servidor) de un estudiante o de todo un curso y
 * la persiste como `avgScoreServer` en la matrícula. Útil para refrescar el valor
 * de confianza que muestran los paneles antes de generar certificados.
 *
 * Body: { courseId, studentId? }  (sin studentId → todo el curso)
 * Auth: SUPER_ADMIN, ADMIN o INSTRUCTOR de la institución del curso.
 */

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { computeCourseScore } from '@/lib/scoring-service';

const FieldValue = admin.firestore.FieldValue;

async function courseInInstitution(courseId: string, institutionId?: string): Promise<boolean> {
    if (!institutionId) return true;
    const snap = await adminDb.collection('courses').doc(courseId).get();
    if (!snap.exists) return false;
    const inst = String(snap.data()?.institutionId ?? '');
    return inst === '' || inst === institutionId;
}

async function recomputeOne(courseId: string, studentId: string): Promise<number> {
    const computed = await computeCourseScore(courseId, studentId);
    await adminDb.collection('courses').doc(courseId)
        .collection('enrollments').doc(studentId)
        .set({
            avgScoreServer: computed.score,
            scoreSource: computed.source,
            scoreUpdatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    return computed.score;
}

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const rl = await rateLimiter.check(`recompute-score:${ip}`, { max: 60, windowMs: 600_000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });

    const auth = await withAuth(req, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (auth instanceof NextResponse) return auth;

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

    const courseId = String(body.courseId ?? '');
    if (!courseId) return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });
    const scopeInstitution = auth.role === 'SUPER_ADMIN' ? undefined : auth.institutionId;
    if (!(await courseInInstitution(courseId, scopeInstitution))) {
        return NextResponse.json({ error: 'Curso fuera de tu institución' }, { status: 403 });
    }

    try {
        if (body.studentId) {
            const score = await recomputeOne(courseId, String(body.studentId));
            return NextResponse.json({ updated: 1, scores: { [String(body.studentId)]: score } });
        }
        const enrollSnap = await adminDb.collection('courses').doc(courseId).collection('enrollments').get();
        const scores: Record<string, number> = {};
        for (const d of enrollSnap.docs) scores[d.id] = await recomputeOne(courseId, d.id);
        return NextResponse.json({ updated: enrollSnap.size, scores });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
    }
}
