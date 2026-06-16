/**
 * POST /api/admin/sedes — Crea una sede validando el límite de sedes del plan
 * de la institución EN EL SERVIDOR. Antes el límite solo se chequeaba en la UI
 * (bypassable escribiendo directo a Firestore con el SDK del cliente).
 *
 * Auth: ADMIN (de su propia institución) o SUPER_ADMIN (puede indicar institutionId).
 * Body: { name, city, address?, institutionId? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp } from '@/lib/rate-limiter';

// Límite de sedes por plan. -1 = ilimitadas. Debe coincidir con la UI
// (admin/sedes/page.tsx) para que el aviso y el enforcement concuerden.
const BRANCH_LIMITS: Record<string, number> = {
  free: 1, starter: 1,
  sst: 1, sstsinlicencia: 1, sstconlicencia: 1,
  pyme: 3, business: 5,
  corporate: -1, enterprise: -1,
};

function branchLimit(planType: string | undefined): number {
  const key = (planType ?? 'free').toLowerCase().trim();
  return BRANCH_LIMITS[key] ?? 1;
}

export async function POST(req: NextRequest) {
  const auth = await withAuth(req, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  let body: { name?: string; city?: string; address?: string; institutionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const name = body.name?.trim();
  const city = body.city?.trim();
  if (!name || !city) {
    return NextResponse.json({ error: 'Nombre y ciudad son obligatorios.' }, { status: 400 });
  }

  // El ADMIN solo opera sobre su institución; el SUPER_ADMIN puede indicar otra.
  const institutionId =
    auth.role === 'SUPER_ADMIN' && body.institutionId ? body.institutionId : auth.institutionId;
  if (!institutionId) {
    return NextResponse.json({ error: 'El administrador no tiene institución asignada.' }, { status: 400 });
  }

  const instSnap = await adminDb.collection('institutions').doc(institutionId).get();
  if (!instSnap.exists) {
    return NextResponse.json({ error: 'Institución no encontrada.' }, { status: 404 });
  }
  const inst = instSnap.data()!;

  // No permitir crear sedes en una institución suspendida/vencida.
  if (inst.status === 'suspended') {
    return NextResponse.json({ error: 'Institución suspendida por falta de pago.' }, { status: 403 });
  }

  // ── Enforcement del límite del plan ───────────────────────────────────────
  const limit = branchLimit(inst.planType as string | undefined);
  if (limit !== -1) {
    const countSnap = await adminDb
      .collection('sedes')
      .where('institutionId', '==', institutionId)
      .where('isActive', '==', true)
      .count()
      .get();
    const current = countSnap.data().count;
    if (current >= limit) {
      await auditLog({
        type: 'plan_limit_reached',
        userId: auth.uid,
        severity: 'INFO',
        ip: getClientIp(req),
        metadata: { resource: 'sedes', institutionId, planType: inst.planType, limit, current },
      });
      return NextResponse.json(
        { error: `Tu plan permite máximo ${limit} sede(s). Mejora el plan para agregar más.` },
        { status: 403 },
      );
    }
  }

  const ref = await adminDb.collection('sedes').add({
    institutionId,
    name,
    city,
    address: body.address?.trim() || null,
    adminId: null,
    adminName: null,
    isActive: true,
    createdBy: auth.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
