import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { checkCronSecret } from '@/lib/platform-metrics';

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

// Límites por plan (alineados con el seed platform/config y onInstitutionCreated).
const PLAN_LIMITS: Record<string, Record<string, number | boolean>> = {
  pyme:          { maxUsers: 15, maxSeats: 1, maxActiveCourses: 3, maxManikins: 1, historyMonths: 6, canUseLiveSessions: false, canUseBiReports: false, canUseApi: false, canUseMultiSite: false, requiresSstLicense: false },
  business:      { maxUsers: 50, maxSeats: 5, maxActiveCourses: 10, maxManikins: 3, historyMonths: 12, canUseLiveSessions: true, canUseBiReports: false, canUseApi: false, canUseMultiSite: false, requiresSstLicense: false },
  corporate:     { maxUsers: 200, maxSeats: 20, maxActiveCourses: 40, maxManikins: 10, historyMonths: 24, canUseLiveSessions: true, canUseBiReports: true, canUseApi: true, canUseMultiSite: true, requiresSstLicense: false },
  enterprise:    { maxUsers: -1, maxSeats: -1, maxActiveCourses: -1, maxManikins: -1, historyMonths: -1, canUseLiveSessions: true, canUseBiReports: true, canUseApi: true, canUseMultiSite: true, requiresSstLicense: false },
  sstSinLicencia:{ maxUsers: 10, maxSeats: 1, maxActiveCourses: 10, maxManikins: 1, historyMonths: 12, canUseLiveSessions: false, canUseBiReports: false, canUseApi: false, canUseMultiSite: false, requiresSstLicense: false },
  sstConLicencia:{ maxUsers: 25, maxSeats: 3, maxActiveCourses: 20, maxManikins: 2, historyMonths: 24, canUseLiveSessions: true, canUseBiReports: true, canUseApi: false, canUseMultiSite: false, requiresSstLicense: true },
};

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
