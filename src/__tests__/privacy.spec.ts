import { describe, expect, it } from 'vitest';
import { addBusinessDays, ageOn, parseGuardian } from '@/lib/privacy';

describe('privacy: reglas de la Ley 1581', () => {
  const today = new Date(Date.UTC(2026, 10, 7));

  it('calcula la edad cumplida', () => {
    expect(ageOn('2008-11-07', today)).toBe(18);
    expect(ageOn('2008-11-08', today)).toBe(17);
    expect(ageOn('2026-12-01', today)).toBeNull();
    expect(ageOn('2010-02-30', today)).toBeNull();
    expect(ageOn('07/11/2008', today)).toBeNull();
  });

  it('exige todos los datos del representante legal', () => {
    const full = { name: 'Luz Pérez', documentType: 'CC', document: '123456', relationship: 'Madre', email: 'Luz@Correo.co' };
    expect(parseGuardian(full)).toEqual({ ...full, email: 'luz@correo.co' });
    expect(parseGuardian({ ...full, document: '' })).toBeNull();
    expect(parseGuardian({ ...full, email: 'no-es-correo' })).toBeNull();
    expect(parseGuardian(null)).toBeNull();
  });

  it('cuenta solo días hábiles para el plazo de respuesta', () => {
    // Viernes 6 de noviembre de 2026 + 10 días hábiles = viernes 20.
    const due = addBusinessDays(new Date(Date.UTC(2026, 10, 6)), 10);
    expect(due.toISOString().slice(0, 10)).toBe('2026-11-20');
  });
});
