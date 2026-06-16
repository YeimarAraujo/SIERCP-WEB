import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { checkCronSecret } from '@/lib/platform-metrics';
import { suspendInstitution, isNonExpiringPlan, GRACE_DAYS } from '@/lib/plan-enforcement';

/**
 * GET /api/cron/plan-expiry  (Cloudflare Cron, diario)
 * 1. Alerta 3 días antes del vencimiento del plan y de la licencia SST.
 * 2. Enforcement: plan vencido → `past_due` (gracia) → SUSPEND tras GRACE_DAYS.
 * Reemplaza la CF notifyPlanExpiry. Auth: Authorization: Bearer <CRON_SECRET>.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkCronSecret(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
  const fourDays = new Date(); fourDays.setDate(fourDays.getDate() + 4);
  const tsThree = admin.firestore.Timestamp.fromDate(threeDays);
  const tsFour = admin.firestore.Timestamp.fromDate(fourDays);
  const now = admin.firestore.Timestamp.now();

  // ── Planes próximos a vencer ────────────────────────────────────────────────
  const planSnap = await adminDb.collectionGroup('planMembership')
    .where('isActive', '==', true)
    .where('planExpiresAt', '>=', tsThree).where('planExpiresAt', '<', tsFour)
    .get();
  let plans = 0;
  for (let i = 0; i < planSnap.docs.length; i += 400) {
    const batch = adminDb.batch();
    for (const planDoc of planSnap.docs.slice(i, i + 400)) {
      const institutionId = planDoc.ref.parent.parent?.id;
      if (!institutionId) continue;
      batch.set(adminDb.collection('calendar').doc(), {
        title: 'Vencimiento de plan SIERCP',
        description: 'Tu suscripción vence en 3 días. Renueva para evitar interrupciones.',
        type: 'vencimiento_plan', startAt: planDoc.data().planExpiresAt, endAt: null,
        allDay: true, institutionId, targetRole: 'ADMIN', targetUserIds: [],
        linkedEntityType: null, linkedEntityId: null, isRecurring: false, recurrenceRule: null,
        color: '#D97706', icon: 'warning', isCompleted: false, createdBy: 'system', createdAt: now,
      });
      plans++;
    }
    await batch.commit();
  }

  // ── Licencias SST próximas a vencer ─────────────────────────────────────────
  const sstSnap = await adminDb.collection('users')
    .where('sstLicenseVerified', '==', true)
    .where('sstLicenseExpiresAt', '>=', tsThree).where('sstLicenseExpiresAt', '<', tsFour)
    .get();
  let sst = 0;
  for (let i = 0; i < sstSnap.docs.length; i += 400) {
    const batch = adminDb.batch();
    for (const userDoc of sstSnap.docs.slice(i, i + 400)) {
      batch.set(adminDb.collection('notifications').doc(), {
        userId: userDoc.id, title: 'Licencia SST próxima a vencer',
        body: 'Tu licencia SST vence en 3 días. Renueva para mantener el acceso.',
        type: 'warning', isRead: false, createdAt: now,
      });
      sst++;
    }
    await batch.commit();
  }

  // ── Enforcement: planes ya vencidos ────────────────────────────────────────
  // Estado: active → past_due (marca fecha) → [GRACE_DAYS] → suspended.
  const expiredSnap = await adminDb.collectionGroup('planMembership')
    .where('isActive', '==', true)
    .where('planExpiresAt', '<', now)
    .get();

  let pastDue = 0, suspended = 0;
  for (const planDoc of expiredSnap.docs) {
    const institutionId = planDoc.ref.parent.parent?.id;
    if (!institutionId) continue;
    if (isNonExpiringPlan(planDoc.data().planType)) continue;

    const instRef = adminDb.collection('institutions').doc(institutionId);
    const instSnap = await instRef.get();
    if (!instSnap.exists) continue;
    const inst = instSnap.data()!;
    if (inst.status === 'suspended') continue; // ya suspendida

    if (inst.status !== 'past_due') {
      // 1ª pasada tras el vencimiento: marcar past_due e iniciar gracia + aviso.
      await instRef.set(
        { status: 'past_due', pastDueSince: now, updatedAt: now },
        { merge: true },
      );
      await adminDb.collection('calendar').doc().set({
        title: 'Plan SIERCP vencido',
        description: `Tu plan venció. Tienes ${GRACE_DAYS} días para renovar antes de que se suspenda el acceso.`,
        type: 'vencimiento_plan', startAt: now, endAt: null, allDay: true,
        institutionId, targetRole: 'ADMIN', targetUserIds: [],
        linkedEntityType: null, linkedEntityId: null, isRecurring: false, recurrenceRule: null,
        color: '#DC2626', icon: 'warning', isCompleted: false, createdBy: 'system', createdAt: now,
      });
      pastDue++;
    } else {
      // Ya estaba en gracia: ¿se acabó el plazo?
      const since = (inst.pastDueSince as admin.firestore.Timestamp | undefined)?.toDate() ?? new Date();
      const daysOverdue = (Date.now() - since.getTime()) / 86_400_000;
      if (daysOverdue >= GRACE_DAYS) {
        await suspendInstitution(adminDb, institutionId);
        suspended++;
      }
    }
  }

  return NextResponse.json({ ok: true, plans, sst, pastDue, suspended });
}
