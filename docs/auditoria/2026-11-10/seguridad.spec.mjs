// Evidencia de la auditoría del commit 2fbef50. Estos casos describen defectos
// existentes; NO son criterios de aceptación de las futuras correcciones.
// Se ejecutan aparte de la suite normal; todas las operaciones remotas son mocks.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: { collection: vi.fn() },
}));
vi.mock('@/lib/automation-engine', () => ({ processExpiredCohorts: vi.fn() }));

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { processExpiredCohorts } from '@/lib/automation-engine';
import { GET as checkCohorts } from '@/app/api/cron/check-cohorts/route';
import { GET as listAdminCourses } from '@/app/api/admin/courses/route';
import { withAuth } from '@/lib/withAuth';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('CRON_SECRET', undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('Evidencia local de defectos de autorización (sin servicios reales)', () => {
  it('S-01: sin CRON_SECRET, un GET anónimo llega al motor de mantenimiento', async () => {
    processExpiredCohorts.mockResolvedValue({ closed: 0, opened: 0, generated: 0 });
    const response = await checkCohorts(new NextRequest('http://localhost/api/cron/check-cohorts'));
    expect(response.status).toBe(200);
    expect(processExpiredCohorts).toHaveBeenCalledWith(adminDb);
  });

  it('S-01 control: con secreto configurado, el mismo GET anónimo se rechaza', async () => {
    vi.stubEnv('CRON_SECRET', 'secreto-simulado-de-auditoria');
    const response = await checkCohorts(new NextRequest('http://localhost/api/cron/check-cohorts'));
    expect(response.status).toBe(401);
    expect(processExpiredCohorts).not.toHaveBeenCalled();
  });

  it('S-02: un claim de superadmin evita consultar el estado actual del perfil', async () => {
    adminAuth.verifyIdToken.mockResolvedValue({ uid: 'sa-simulado', isSuperAdmin: true });
    adminDb.collection.mockImplementation(() => {
      throw new Error('El perfil actual nunca llega a consultarse');
    });
    const result = await withAuth(new NextRequest('http://localhost/api/privacy', {
      headers: { Authorization: 'Bearer token-simulado' },
    }), ['SUPER_ADMIN']);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result.role).toBe('SUPER_ADMIN');
    expect(adminDb.collection).not.toHaveBeenCalled();
    // No se solicita a Firebase la comprobación adicional de revocación.
    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('token-simulado');
  });

  it('S-02: el listado administrativo acepta un perfil con isActive=false', async () => {
    adminAuth.verifyIdToken.mockResolvedValue({ uid: 'admin-simulado' });
    const profile = { role: 'ADMIN', isActive: false, institutionId: 'institucion-simulada' };
    const query = { get: vi.fn().mockResolvedValue({ docs: [] }) };
    adminDb.collection.mockImplementation((name) => {
      if (name === 'users') return { doc: () => ({ get: async () => ({ exists: true, data: () => profile }) }) };
      if (name === 'courses') return { where: () => query };
      throw new Error(`Colección inesperada: ${name}`);
    });
    const response = await listAdminCourses(new NextRequest('http://localhost/api/admin/courses', {
      headers: { Authorization: 'Bearer token-admin-simulado' },
    }));
    expect(response.status).toBe(200);
    expect(query.get).toHaveBeenCalledOnce();
  });
});
