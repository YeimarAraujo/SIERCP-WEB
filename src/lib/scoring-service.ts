/**
 * scoring-service.ts — Cálculo AUTORITATIVO de la nota de un curso (servidor).
 *
 * Cierra H-5: el gating de certificación NO debe confiar en `enrollment.avgScore`
 * (campo que la app del estudiante escribe directamente). En su lugar, la nota se
 * recalcula en el servidor a partir de los documentos de sesión individuales
 * (`sessions`), que son telemetría auditable: forjar la nota exigiría fabricar
 * documentos de sesión (visibles al instructor), no editar un solo campo.
 *
 * Política: promedio de `metrics.score` de las sesiones COMPLETADAS del estudiante
 * en ese curso. Si no hay sesiones, cae al `enrollment.avgScore` legado (marcado
 * como no-confiable en el resultado) para no romper cursos históricos.
 */

import { adminDb } from './firebase-admin';
import { officialScore } from './session-grading-service';
import { evaluateCourseApproval, type CourseApproval, type GradeParts } from './course-approval';

export interface CourseScore {
    score: number;          // 0–100 (nota autoritativa para el gating)
    sessionCount: number;   // sesiones completadas consideradas
    source: 'sessions' | 'legacy-enrollment' | 'none';
    trusted: boolean;       // true si provino de sesiones (servidor)
    /** Regla del curso: promedio ≥ 80 y 70 % por parte, solo con notas oficiales. */
    approval: CourseApproval;
}

/** Recalcula la nota autoritativa de un estudiante en un curso. */
export async function computeCourseScore(courseId: string, studentId: string): Promise<CourseScore> {
    // Sesiones del estudiante; filtramos curso + estado en memoria para no exigir
    // un índice compuesto nuevo (el set por estudiante es pequeño).
    const snap = await adminDb.collection('sessions')
        .where('studentId', '==', studentId)
        .get();

    // Solo cuentan las notas oficiales que el servidor calculó desde la señal
    // del maniquí. El `metrics.score` que escribe la app no es confiable.
    const scores: number[] = [];
    const parts: GradeParts[] = [];
    const clientScores: number[] = [];
    snap.docs.forEach((d) => {
        const data = d.data();
        if (data.courseId !== courseId) return;
        if (data.status && data.status !== 'completed') return;
        const official = officialScore(data);
        if (official !== null) {
            scores.push(official);
            const g = data.officialGrade as Record<string, unknown>;
            parts.push({
                score: official,
                compressions: Number(g.compressions) || 0,
                correctDepth: Number(g.correctDepth) || 0,
                fullRecoil: Number(g.fullRecoil) || 0,
                correctRate: Number(g.correctRate) || 0,
            });
            return;
        }
        const m = (data.metrics ?? {}) as Record<string, unknown>;
        const n = Number(m.score ?? m.qualityScore ?? data.score);
        if (Number.isFinite(n) && n > 0) clientScores.push(n);
    });

    const course = (await adminDb.collection('courses').doc(courseId).get()).data();
    const approval = evaluateCourseApproval(parts, (course?.minScore ?? course?.requiredScore) as number | undefined);

    if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { score: Math.round(avg), sessionCount: scores.length, source: 'sessions', trusted: true, approval };
    }
    if (clientScores.length > 0) {
        const avg = clientScores.reduce((a, b) => a + b, 0) / clientScores.length;
        return { score: Math.round(avg), sessionCount: clientScores.length, source: 'sessions', trusted: false, approval };
    }

    // Fallback legado: enrollment.avgScore (NO confiable — sólo para no romper).
    try {
        const enroll = (await adminDb
            .collection('courses').doc(courseId)
            .collection('enrollments').doc(studentId).get()).data();
        const legacy = Number(enroll?.avgScore ?? 0);
        if (Number.isFinite(legacy) && legacy > 0) {
            return { score: Math.round(legacy), sessionCount: 0, source: 'legacy-enrollment', trusted: false, approval };
        }
    } catch { /* ignore */ }

    return { score: 0, sessionCount: 0, source: 'none', trusted: false, approval };
}
