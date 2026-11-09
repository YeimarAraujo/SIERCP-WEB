import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { checkCronSecret } from '@/lib/platform-metrics';
import { PLAN_LIMITS } from '@/lib/plan-limits';

/**
 * GET /api/cron/reconcile-provisioning  (Cloudflare Cron cada 5 min)
 *
 * Re-aloja onInstitutionCreated (los triggers Firestore NO corren en Spark):
 * provisiona `institutions/{id}/planMembership/current` para toda institución
 * que aún no lo tenga, según su `planType`. Cubre TODOS los caminos de creación
 * (web API y Flutter client-side). Idempotente.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>.
 */
export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  if (!checkCronSecret(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const insts = await adminDb.collection('institutions').get();
  const now = admin.firestore.Timestamp.now();
  let provisioned = 0;

  for (const doc of insts.docs) {
    const planRef = adminDb.doc(`institutions/${doc.id}/planMembership/current`);
    if ((await planRef.get()).exists) continue; // ya provisionada

    const data = doc.data();
    const planType = (data.planType as string) ?? 'pyme';
    const limits = PLAN_LIMITS[planType] ?? PLAN_LIMITS.pyme;

    const expires = data.planExpiresAt as admin.firestore.Timestamp | undefined;
    const trial = new Date(); trial.setDate(trial.getDate() + 30);

    await planRef.set({
      planType,
      status: 'approved',
      isActive: true,
      planExpiresAt: expires ?? admin.firestore.Timestamp.fromDate(trial),
      creditBalance: 0,
      ...limits,
      canRecordSessions: limits.canUseLiveSessions ?? false,
      usageCurrentUsers: 0,
      usageCurrentCourses: 0,
      usageCertificatesThisMonth: 0,
      usagePeriodStart: now,
      updatedAt: now,
      updatedBy: 'reconcile-cron',
    });
    provisioned++;
  }

  return NextResponse.json({ ok: true, provisioned, total: insts.size });
}
