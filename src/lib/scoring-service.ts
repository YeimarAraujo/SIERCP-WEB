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

export interface CourseScore {
    score: number;          // 0–100 (nota autoritativa para el gating)
    sessionCount: number;   // sesiones completadas consideradas
    source: 'sessions' | 'legacy-enrollment' | 'none';
    trusted: boolean;       // true si provino de sesiones (servidor)
}

/** Recalcula la nota autoritativa de un estudiante en un curso. */
export async function computeCourseScore(courseId: string, studentId: string): Promise<CourseScore> {
    // Sesiones del estudiante; filtramos curso + estado en memoria para no exigir
    // un índice compuesto nuevo (el set por estudiante es pequeño).
    const snap = await adminDb.collection('sessions')
        .where('studentId', '==', studentId)
        .get();

    const scores: number[] = [];
    snap.docs.forEach((d) => {
        const data = d.data();
        if (data.courseId !== courseId) return;
        if (data.status && data.status !== 'completed') return;
        const m = (data.metrics ?? {}) as Record<string, unknown>;
        const raw = m.score ?? m.qualityScore ?? data.score;
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) scores.push(n);
    });

    if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { score: Math.round(avg), sessionCount: scores.length, source: 'sessions', trusted: true };
    }

    // Fallback legado: enrollment.avgScore (NO confiable — sólo para no romper).
    try {
        const enroll = (await adminDb
            .collection('courses').doc(courseId)
            .collection('enrollments').doc(studentId).get()).data();
        const legacy = Number(enroll?.avgScore ?? 0);
        if (Number.isFinite(legacy) && legacy > 0) {
            return { score: Math.round(legacy), sessionCount: 0, source: 'legacy-enrollment', trusted: false };
        }
    } catch { /* ignore */ }

    return { score: 0, sessionCount: 0, source: 'none', trusted: false };
}
