import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { processExpiredCohorts } from '@/lib/automation-engine';

/**
 * POST /api/cron/check-cohorts
 *
 * Scheduled endpoint that processes cohort lifecycle events:
 *   1. Closes OPEN cohorts whose enrollment period has expired
 *   2. Opens UPCOMING cohorts whose enrollment period has started
 *   3. Generates successor cohorts for automated templates
 *
 * Security: Protected by a shared secret (CRON_SECRET).
 * Intended to be called by:
 *   - Vercel Cron Jobs (vercel.json)
 *   - External scheduler (e.g., Cloud Scheduler)
 *   - Manual trigger for testing
 *
 * Schedule: Every hour (recommended)
 */
export async function POST(req: NextRequest) {
  try {
    // ─── Verify cron secret ──────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('[Cron] Starting cohort lifecycle check...');

    const result = await processExpiredCohorts(adminDb);

    console.log('[Cron] Complete:', JSON.stringify(result));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno del cron';
    console.error('[Cron] Fatal error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET is also supported for easy browser-based testing.
 * In production, restrict this via middleware or remove.
 */
export async function GET(req: NextRequest) {
  return POST(req);
}
