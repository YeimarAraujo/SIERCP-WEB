import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { computeMetrics, checkCronSecret } from '@/lib/platform-metrics';

/**
 * GET /api/cron/platform-metrics  (Cloudflare Worker Cron → este endpoint)
 * Recalcula KPIs y los escribe en platformMetrics/global.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkCronSecret(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const metrics = await computeMetrics();
  await adminDb.doc('platformMetrics/global').set(metrics, { merge: true });
  return NextResponse.json({ ok: true });
}
