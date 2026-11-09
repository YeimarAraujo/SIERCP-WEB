import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { delete: () => '__delete__', serverTimestamp: () => '__now__' },
}));

import { anonymizedProfile, PERSONAL_FIELDS, revokedVerification } from '@/lib/erase-user';

describe('supresión de datos del titular', () => {
  it('quita todo dato que identifique a la persona', () => {
    const profile = anonymizedProfile('u1');
    for (const field of PERSONAL_FIELDS) expect(profile[field]).toBe('__delete__');
    expect(profile).toMatchObject({
      firstName: 'Usuario',
      lastName: 'eliminado',
      email: 'eliminado-u1@invalid.sicap',
      isActive: false,
      publicProfile: false,
    });
  });

  it('borra cédula, teléfono y fecha de nacimiento', () => {
    expect(PERSONAL_FIELDS).toEqual(expect.arrayContaining(['identification', 'identificacion', 'phoneNumber', 'birthDate']));
  });

  it('revoca la verificación pública y quita nombre y perfil', () => {
    expect(revokedVerification()).toEqual({
      status: 'REVOKED',
      revokedReason: 'titular_eliminado',
      userPublicName: '__delete__',
      userSlug: '__delete__',
    });
  });
});
