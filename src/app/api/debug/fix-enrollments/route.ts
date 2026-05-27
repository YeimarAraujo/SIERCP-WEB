/**
 * GET /api/debug/fix-enrollments
 *
 * Backfill: sets templateId on platform_enrollments that are missing it.
 * PROTECTED: SUPER_ADMIN only in development. Returns 404 in production.
 * Run once manually; not idempotent (but safe to re-run — only updates missing ones).
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const auth = await withAuth(req, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) {
    await auditLog({
      type: 'debug_access_blocked',
      severity: 'WARN',
      ip: getClientIp(req),
      metadata: { endpoint: '/api/debug/fix-enrollments', reason: 'unauthorized' },
    });
    return auth;
  }

  try {
    const snaps = await adminDb.collection('platform_enrollments').get();
    let count = 0;

    for (const doc of snaps.docs) {
      const data = doc.data();
      if (!data.templateId && data.courseSlug) {
        const tSnap = await adminDb
          .collection('course_templates')
          .where('slug', '==', data.courseSlug)
          .limit(1)
          .get();
        if (!tSnap.empty) {
          await doc.ref.update({ templateId: tSnap.docs[0].id });
          count++;
        }
      }
    }

    await auditLog({
      type: 'super_admin_action',
      userId: auth.uid,
      severity: 'INFO',
      ip: getClientIp(req),
      metadata: { action: 'fix-enrollments', updatedCount: count },
    });

    return NextResponse.json({ message: `Updated ${count} enrollments` }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    );
  }
}
