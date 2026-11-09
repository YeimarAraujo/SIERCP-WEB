import { describe, expect, it } from 'vitest';
import { normalizeEmail, normalizeIdentification, toCard } from '@/lib/people';

describe('people: datos mínimos de otras personas', () => {
  it('limpia la cédula y rechaza valores inválidos', () => {
    expect(normalizeIdentification(' 1.065.123.456 ')).toBe('1065123456');
    expect(normalizeIdentification('12')).toBeNull();
    expect(normalizeIdentification(123)).toBeNull();
  });

  it('valida el correo', () => {
    expect(normalizeEmail(' Ana@Correo.co ')).toBe('ana@correo.co');
    expect(normalizeEmail('sin-arroba')).toBeNull();
  });

  it('solo expone los campos necesarios', () => {
    const card = toCard('u1', {
      firstName: 'Ana', lastName: 'Ruiz', email: 'a@x.co', role: 'USUARIO',
      identificacion: '123456', phoneNumber: '300', birthDate: '2000-01-01', address: 'Calle 1',
    }, true);
    expect(card).toEqual({
      uid: 'u1', firstName: 'Ana', lastName: 'Ruiz', email: 'a@x.co', role: 'USUARIO',
      avatarUrl: null, identification: '123456',
    });
    expect(toCard('u1', { identification: '1' }, false)).not.toHaveProperty('identification');
  });
});
