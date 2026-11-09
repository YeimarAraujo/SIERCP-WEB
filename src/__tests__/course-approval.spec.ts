import { describe, expect, it } from 'vitest';
import { evaluateCourseApproval, type GradeParts } from '@/lib/course-approval';

const good: GradeParts = { score: 90, compressions: 100, correctDepth: 90, fullRecoil: 95, correctRate: 85 };

describe('aprobación del curso: promedio 80 y 70 % en cada parte', () => {
  it('aprueba con buen promedio y todas las partes sobre 70 %', () => {
    const result = evaluateCourseApproval([good, { ...good, score: 80 }]);
    expect(result).toMatchObject({ approved: true, averageScore: 85, minScore: 80, missing: [] });
  });

  it('no aprueba con promedio bajo 80 aunque las sesiones aprueben con 70', () => {
    const result = evaluateCourseApproval([{ ...good, score: 75 }, { ...good, score: 78 }]);
    expect(result.approved).toBe(false);
    expect(result.missing[0]).toContain('Promedio de 77');
  });

  it('no aprueba si una sola parte queda bajo 70 %, aunque el promedio sea alto', () => {
    const result = evaluateCourseApproval([{ ...good, correctRate: 60 }]);
    expect(result.approved).toBe(false);
    expect(result.ratePct).toBe(60);
    expect(result.missing).toEqual([expect.stringContaining('Ritmo correcto en 60 %')]);
  });

  it('suma las compresiones de todas las sesiones', () => {
    const result = evaluateCourseApproval([
      { score: 90, compressions: 100, correctDepth: 100, fullRecoil: 100, correctRate: 100 },
      { score: 90, compressions: 100, correctDepth: 40, fullRecoil: 100, correctRate: 100 },
    ]);
    expect(result.depthPct).toBe(70);
    expect(result.approved).toBe(true);
  });

  it('respeta la nota mínima del curso si el instructor la define', () => {
    expect(evaluateCourseApproval([good], 95).approved).toBe(false);
    expect(evaluateCourseApproval([good], null).minScore).toBe(80);
  });

  it('sin sesiones oficiales no aprueba', () => {
    expect(evaluateCourseApproval([])).toMatchObject({ approved: false, sessionCount: 0 });
  });
});
