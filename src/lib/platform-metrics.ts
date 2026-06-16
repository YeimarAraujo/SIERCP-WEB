import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

/**
 * KPIs de plataforma (Spark) — calculados con count()/sum(). Compartido por
 * el recompute on-demand (Super Admin) y el cron (Cloudflare → /api/cron/platform-metrics).
 */

async function countOf(q: admin.firestore.Query | admin.firestore.CollectionReference): Promise<number> {
  return (await q.count().get()).data().count;
}

export async function computeMetrics(): Promise<Record<string, unknown>> {
  const now = admin.firestore.Timestamp.now();
  const d30 = admin.firestore.Timestamp.fromMillis(now.toMillis() - 30 * 24 * 3600 * 1000);
  const users = adminDb.collection('users');
  const institutions = adminDb.collection('institutions');

  const [totalUsers, activeUsers30d, newUsers30d, totalInstitutions, activeInstitutions, skillsIssued, skillsActive, badgesIssued] =
    await Promise.all([
      countOf(users),
      countOf(users.where('updatedAt', '>=', d30)),
      countOf(users.where('createdAt', '>=', d30)),
      countOf(institutions),
      countOf(institutions.where('status', '==', 'active')),
      countOf(adminDb.collection('userSkills')),
      countOf(adminDb.collection('userSkills').where('status', '==', 'ACTIVE')),
      countOf(adminDb.collection('userBadges').where('status', '==', 'ACTIVE')),
    ]);

  let revenueCents = 0;
  let approvedCount = 0;
  try {
    const agg = await adminDb.collection('transactions').where('status', '==', 'APPROVED')
      .aggregate({ revenue: admin.firestore.AggregateField.sum('amount_in_cents'), n: admin.firestore.AggregateField.count() })
      .get();
    revenueCents = (agg.data().revenue as number) ?? 0;
    approvedCount = (agg.data().n as number) ?? 0;
  } catch (e) {
    console.error('[metrics] revenue aggregate', e);
  }

  return {
    totalUsers, activeUsers30d, newUsers30d,
    retention30d: totalUsers > 0 ? Math.round((activeUsers30d / totalUsers) * 100) : 0,
    totalInstitutions, activeInstitutions,
    skillsIssued, skillsActive, badgesIssued,
    revenueCents, approvedTransactions: approvedCount,
    ticketAvgCents: approvedCount > 0 ? Math.round(revenueCents / approvedCount) : 0,
    updatedAt: now,
  };
}

/** Verifica el secreto de cron (Authorization: Bearer <CRON_SECRET>). */
export function checkCronSecret(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const authz = req.headers.get('authorization') ?? '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  return token === expected;
}
