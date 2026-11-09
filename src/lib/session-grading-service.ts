/** Calcula y guarda la nota oficial de una sesión (solo servidor). */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { gradeSeries, type OfficialGrade } from './session-grading';

/**
 * Lee la señal de profundidad de la sesión, calcula la nota y la guarda en
 * `sessions/{id}.officialGrade`. Devuelve null si la sesión no tiene señal
 * guardada (sesiones antiguas o sin maniquí): sin señal no hay nota oficial.
 */
export async function gradeSession(db: Firestore, sessionId: string): Promise<OfficialGrade | null> {
  const ref = db.collection('sessions').doc(sessionId);
  const series = (await ref.collection('compressions').doc('serie').get()).data();
  const samples = Array.isArray(series?.depthTenthsMm) ? (series!.depthTenthsMm as unknown[]).map(Number).filter(Number.isFinite) : [];
  const hz = Number(series?.sampleHz) > 0 ? Number(series!.sampleHz) : 20;

  if (samples.length === 0) {
    await ref.set({ officialGrade: { unavailable: true, reason: 'sin_senal', computedAt: FieldValue.serverTimestamp() } }, { merge: true });
    return null;
  }

  const grade = gradeSeries(samples, hz);
  await ref.set({ officialGrade: { ...grade, computedAt: FieldValue.serverTimestamp() } }, { merge: true });
  return grade;
}

/** Nota oficial ya guardada, o null. */
export function officialScore(session: Record<string, unknown> | undefined): number | null {
  const grade = session?.officialGrade as { score?: unknown; unavailable?: boolean } | undefined;
  if (!grade || grade.unavailable) return null;
  const n = Number(grade.score);
  return Number.isFinite(n) ? n : null;
}
