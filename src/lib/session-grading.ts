/**
 * Calificación oficial de una sesión de RCP, calculada en el servidor.
 *
 * La app escribe su propio `metrics.score`, que un usuario podría alterar. La
 * nota oficial se recalcula aquí desde la señal de profundidad guardada en
 * `sessions/{id}/compressions/serie` (décimas de mm, ~20 Hz), con los mismos
 * umbrales y la misma fórmula que el motor de la app (rcp_engine.dart):
 *
 *   nota = 40 × %profundidad correcta + 30 × %retroceso completo + 30 × %ritmo correcto
 *
 * Los umbrales clínicos no se cambian aquí: son los de la app (AHA 2025).
 */

export const GRADING_VERSION = 'serie-v1';

/** Umbrales del motor de la app (rcp_engine.dart). */
export const GRADING = {
  minDepthMm: 50,
  maxDepthMm: 60,
  minRate: 100,
  maxRate: 120,
  recoilResidualMm: 10,
  pauseSeconds: 2,
  startMm: 15,
  peakMinMm: 20,
  endMm: 8,
  minDurationMs: 120,
  maxDurationMs: 900,
  passScore: 70,
} as const;

export interface DetectedCompression {
  startMs: number;
  peakMm: number;
  /** Menor profundidad entre la compresión anterior y esta (retroceso). */
  valleyBeforeMm: number;
}

export interface OfficialGrade {
  version: string;
  compressions: number;
  correctDepth: number;
  correctRate: number;
  fullRecoil: number;
  averageDepthMm: number;
  averageRate: number;
  pauses: number;
  maxPauseSeconds: number;
  score: number;
  approved: boolean;
}

/** Detecta compresiones con la misma máquina de estados del firmware. */
export function detectCompressions(depthTenthsMm: number[], sampleHz: number): DetectedCompression[] {
  const stepMs = 1000 / sampleHz;
  const result: DetectedCompression[] = [];
  let inCompression = false;
  let startMs = 0;
  let peak = 0;
  let valley = Number.POSITIVE_INFINITY;

  depthTenthsMm.forEach((tenths, i) => {
    const depth = tenths / 10;
    const t = i * stepMs;
    if (!inCompression) {
      valley = Math.min(valley, depth);
      if (depth >= GRADING.startMm) {
        inCompression = true;
        startMs = t;
        peak = depth;
      }
      return;
    }
    peak = Math.max(peak, depth);
    if (depth <= GRADING.endMm) {
      const duration = t - startMs;
      if (peak >= GRADING.peakMinMm && duration >= GRADING.minDurationMs && duration <= GRADING.maxDurationMs) {
        result.push({ startMs, peakMm: peak, valleyBeforeMm: valley });
      }
      inCompression = false;
      valley = depth;
    }
  });
  return result;
}

export function gradeSeries(depthTenthsMm: number[], sampleHz: number): OfficialGrade {
  const found = detectCompressions(depthTenthsMm, sampleHz);
  const total = found.length;

  let correctDepth = 0;
  let correctRate = 0;
  let fullRecoil = 0;
  let depthSum = 0;
  let rateSum = 0;
  let rateCount = 0;
  let pauses = 0;
  let maxPause = 0;

  found.forEach((c, i) => {
    if (c.peakMm >= GRADING.minDepthMm && c.peakMm <= GRADING.maxDepthMm) correctDepth++;
    if (c.valleyBeforeMm <= GRADING.recoilResidualMm) fullRecoil++;
    depthSum += c.peakMm;

    // El ritmo de cada compresión sale del intervalo con la vecina (la primera usa la segunda).
    const neighbor = i > 0 ? found[i - 1] : found[i + 1];
    if (!neighbor) return;
    const intervalMs = Math.abs(c.startMs - neighbor.startMs);
    if (i > 0 && intervalMs > GRADING.pauseSeconds * 1000) {
      pauses++;
      maxPause = Math.max(maxPause, intervalMs / 1000);
      return; // tras una pausa el intervalo no es ritmo
    }
    const rate = 60000 / intervalMs;
    rateSum += rate;
    rateCount++;
    if (rate >= GRADING.minRate && rate <= GRADING.maxRate) correctRate++;
  });

  const pct = (n: number) => (total > 0 ? n / total : 0);
  const score = total > 0
    ? Math.round(Math.min(100, Math.max(0, pct(correctDepth) * 40 + pct(fullRecoil) * 30 + pct(correctRate) * 30)))
    : 0;

  return {
    version: GRADING_VERSION,
    compressions: total,
    correctDepth,
    correctRate,
    fullRecoil,
    averageDepthMm: total > 0 ? Math.round((depthSum / total) * 10) / 10 : 0,
    averageRate: rateCount > 0 ? Math.round(rateSum / rateCount) : 0,
    pauses,
    maxPauseSeconds: Math.round(maxPause * 10) / 10,
    score,
    approved: total > 0 && score >= GRADING.passScore,
  };
}
