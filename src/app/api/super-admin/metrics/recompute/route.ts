import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { computeMetrics } from '@/lib/platform-metrics';

/**
 * POST /api/super-admin/metrics/recompute  (Spark — reemplaza la Cloud Function
 * recomputePlatformMetrics). Auth: session cookie + claim isSuperAdmin.
 * El cron (Cloudflare) usa la misma lógica vía /api/cron/platform-metrics.
 */

export const dynamic = 'force-dynamic';

async function isSuperAdmin(): Promise<boolean> {
  const c = await cookies();
  const session = c.get('session')?.value;
  if (!session) return false;
  try {
    return (await adminAuth.verifySessionCookie(session, true))['isSuperAdmin'] === true;
  } catch {
    return false;
  }
}

export async function POST() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const metrics = await computeMetrics();
  await adminDb.doc('platformMetrics/global').set(metrics, { merge: true });
  return NextResponse.json(metrics);
}
