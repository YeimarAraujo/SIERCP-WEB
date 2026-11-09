/**
 * Aprobación de un curso (y derecho al certificado).
 *
 * Regla decidida por el usuario el 2026-11-09, pendiente de validación por un
 * instructor certificado:
 *   - Promedio de las notas oficiales del servidor ≥ nota mínima del curso
 *     (80 si el curso no define otra).
 *   - Sumando todas las sesiones del curso, al menos 70 % de compresiones con
 *     profundidad correcta, 70 % con retroceso completo y 70 % con ritmo
 *     correcto, cada parte por separado.
 * La sesión de práctica sigue aprobando con 70: eso es solo retroalimentación.
 */
import { COURSE_PART_MIN_PCT, COURSE_PASS_AVERAGE } from '@/shared/lib/constants';

export interface GradeParts {
  score: number;
  compressions: number;
  correctDepth: number;
  fullRecoil: number;
  correctRate: number;
}

export interface CourseApproval {
  approved: boolean;
  sessionCount: number;
  averageScore: number;
  minScore: number;
  depthPct: number;
  recoilPct: number;
  ratePct: number;
  /** Lo que falta para aprobar, en palabras para el estudiante. */
  missing: string[];
}

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

export function evaluateCourseApproval(grades: GradeParts[], courseMinScore?: number | null): CourseApproval {
  const minScore = Number(courseMinScore) > 0 ? Number(courseMinScore) : COURSE_PASS_AVERAGE;
  const sessionCount = grades.length;
  const averageScore = sessionCount > 0
    ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / sessionCount)
    : 0;
  const total = grades.reduce((sum, g) => sum + g.compressions, 0);
  const depthPct = pct(grades.reduce((sum, g) => sum + g.correctDepth, 0), total);
  const recoilPct = pct(grades.reduce((sum, g) => sum + g.fullRecoil, 0), total);
  const ratePct = pct(grades.reduce((sum, g) => sum + g.correctRate, 0), total);

  const missing: string[] = [];
  if (sessionCount === 0) missing.push('Aún no hay sesiones con nota oficial.');
  else {
    if (averageScore < minScore) missing.push(`Promedio de ${averageScore}; se necesita ${minScore}.`);
    if (depthPct < COURSE_PART_MIN_PCT) missing.push(`Profundidad correcta en ${depthPct} % de las compresiones; se necesita ${COURSE_PART_MIN_PCT} %.`);
    if (recoilPct < COURSE_PART_MIN_PCT) missing.push(`Retroceso completo en ${recoilPct} % de las compresiones; se necesita ${COURSE_PART_MIN_PCT} %.`);
    if (ratePct < COURSE_PART_MIN_PCT) missing.push(`Ritmo correcto en ${ratePct} % de las compresiones; se necesita ${COURSE_PART_MIN_PCT} %.`);
  }

  return { approved: missing.length === 0, sessionCount, averageScore, minScore, depthPct, recoilPct, ratePct, missing };
}
