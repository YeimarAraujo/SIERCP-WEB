import { describe, expect, it } from 'vitest';
import { detectCompressions, gradeSeries } from '@/lib/session-grading';

/** Señal sintética a 20 Hz: compresiones de `depthMm` a `cpm`, con un fondo de `residualMm`. */
function series({ seconds, cpm, depthMm, residualMm = 2, pauseAt, pauseSeconds = 0 }:
  { seconds: number; cpm: number; depthMm: number; residualMm?: number; pauseAt?: number; pauseSeconds?: number }): number[] {
  const hz = 20;
  const out: number[] = [];
  let phase = 0;
  for (let i = 0; i < seconds * hz; i++) {
    const t = i / hz;
    const paused = pauseAt !== undefined && t >= pauseAt && t < pauseAt + pauseSeconds;
    if (paused) {
      out.push(0);
      continue;
    }
    phase += cpm / 60 / hz;
    const shape = Math.max(0, Math.sin(phase * 2 * Math.PI));
    out.push(Math.round((residualMm + (depthMm - residualMm) * shape) * 10));
  }
  return out;
}

describe('nota oficial calculada en el servidor', () => {
  it('una técnica correcta aprueba con nota alta', () => {
    const grade = gradeSeries(series({ seconds: 30, cpm: 110, depthMm: 55 }), 20);
    expect(grade.compressions).toBeGreaterThan(50);
    expect(grade.correctDepth).toBe(grade.compressions);
    expect(grade.averageRate).toBeGreaterThanOrEqual(100);
    expect(grade.averageRate).toBeLessThanOrEqual(120);
    expect(grade.score).toBeGreaterThanOrEqual(95);
    expect(grade.approved).toBe(true);
  });

  it('compresiones poco profundas no aprueban', () => {
    const grade = gradeSeries(series({ seconds: 30, cpm: 110, depthMm: 40 }), 20);
    expect(grade.correctDepth).toBe(0);
    expect(grade.score).toBeLessThan(70);
    expect(grade.approved).toBe(false);
  });

  it('sin soltar el pecho no cuenta compresiones válidas', () => {
    const grade = gradeSeries(series({ seconds: 30, cpm: 110, depthMm: 55, residualMm: 16 }), 20);
    expect(grade.compressions).toBe(0); // nunca baja de 8 mm: no termina ninguna compresión
    expect(grade.approved).toBe(false);
  });

  it('detecta las pausas', () => {
    const grade = gradeSeries(series({ seconds: 40, cpm: 110, depthMm: 55, pauseAt: 15, pauseSeconds: 6 }), 20);
    expect(grade.pauses).toBe(1);
    expect(grade.maxPauseSeconds).toBeGreaterThanOrEqual(5);
  });

  it('una señal vacía da cero', () => {
    expect(gradeSeries([], 20)).toMatchObject({ compressions: 0, score: 0, approved: false });
    expect(detectCompressions([0, 0, 0], 20)).toEqual([]);
  });
});
