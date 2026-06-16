import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { checkCronSecret } from '@/lib/platform-metrics';

/**
 * GET /api/cron/reset-usage  (Cloudflare Cron, mensual el 1ro)
 * Resetea contadores mensuales de uso en planMembership. Reemplaza la CF
 * resetMonthlyUsage. Auth: Authorization: Bearer <CRON_SECRET>.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkCronSecret(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const snap = await adminDb.collectionGroup('planMembership').where('isActive', '==', true).get();
  const now = admin.firestore.Timestamp.now();

  // Firestore batch limit = 500; paginamos en lotes de 400.
  let processed = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = adminDb.batch();
    for (const doc of snap.docs.slice(i, i + 400)) {
      batch.update(doc.ref, { usageCertificatesThisMonth: 0, usagePeriodStart: now });
    }
    await batch.commit();
    processed += Math.min(400, snap.docs.length - i);
  }

  return NextResponse.json({ ok: true, processed });
}
