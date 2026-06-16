/**
 * plan-enforcement — Suspensión y reactivación de instituciones por estado de plan.
 *
 * Política (decidida 2026-06-15):
 *   - Al vencer el plan (planMembership/current.planExpiresAt < now) la institución
 *     entra en `past_due` con 7 días de gracia (sigue operando, con avisos).
 *   - Pasados GRACE_DAYS sin pago → SUSPEND: se inhabilitan institución, admins,
 *     usuarios creados por la institución, sus membresías, cursos y sedes.
 *   - Al pagar (webhook Wompi) → reactivación: solo se re-habilita lo que la
 *     suspensión apagó (marcado con `suspendedByPlan: true`), preservando las
 *     desactivaciones manuales que el admin hubiera hecho antes.
 *
 * Todo es idempotente y reversible. Nunca borra documentos.
 */

import admin from 'firebase-admin';
import type { Firestore, Query } from 'firebase-admin/firestore';

export const GRACE_DAYS = 7;

/** Plan que nunca se suspende por cron (precio negociado / contrato). */
const NON_EXPIRING_PLANS = new Set(['enterprise']);

export function isNonExpiringPlan(planType: string | undefined): boolean {
  return NON_EXPIRING_PLANS.has((planType ?? '').toLowerCase());
}

// ── Helpers de batch ─────────────────────────────────────────────────────────

/**
 * Aplica `patch` a todos los docs que devuelve `query`, en lotes de 400.
 * `skipUid` permite no tocar un documento concreto (p.ej. nunca un SUPER_ADMIN).
 */
async function patchAll(
  db: Firestore,
  query: Query,
  patch: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>,
  opts?: { skipRole?: string },
): Promise<number> {
  const snap = await query.get();
  let count = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    for (const doc of snap.docs.slice(i, i + 400)) {
      if (opts?.skipRole && doc.get('role') === opts.skipRole) continue;
      batch.set(doc.ref, patch, { merge: true });
      count++;
    }
    await batch.commit();
  }
  return count;
}

// ── Suspensión ─────────────────────────────────────────────────────────────

export async function suspendInstitution(
  db: Firestore,
  institutionId: string,
): Promise<{ users: number; memberships: number; courses: number; sedes: number }> {
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Institución → suspended
  await db.collection('institutions').doc(institutionId).set(
    { status: 'suspended', suspendedAt: now, suspendedReason: 'plan_expired', updatedAt: now },
    { merge: true },
  );

  // 2. Plan (subcolección canónica) → inactivo, para que el cron no lo reprocese
  await db
    .doc(`institutions/${institutionId}/planMembership/current`)
    .set({ isActive: false, status: 'expired', updatedAt: now }, { merge: true })
    .catch(() => {});

  const stamp = {
    isActive: false,
    suspendedByPlan: true,
    disabledReason: 'plan_expired',
    updatedAt: now,
  };

  // 3. Usuarios de la institución (admins + usuarios creados). Nunca un SUPER_ADMIN.
  const users = await patchAll(
    db,
    db.collection('users').where('institutionId', '==', institutionId).where('isActive', '==', true),
    stamp,
    { skipRole: 'SUPER_ADMIN' },
  );

  // 4. Membresías activas de la institución → sin acceso en Flutter
  const memberships = await patchAll(
    db,
    db.collection('memberships').where('institutionId', '==', institutionId).where('isActive', '==', true),
    { isActive: false, suspendedByPlan: true, updatedAt: now },
  );

  // 5. Cursos de la institución
  const courses = await patchAll(
    db,
    db.collection('courses').where('institutionId', '==', institutionId).where('isActive', '==', true),
    { isActive: false, suspendedByPlan: true, updatedAt: now },
  );

  // 6. Sedes de la institución
  const sedes = await patchAll(
    db,
    db.collection('sedes').where('institutionId', '==', institutionId).where('isActive', '==', true),
    { isActive: false, suspendedByPlan: true, updatedAt: now },
  );

  return { users, memberships, courses, sedes };
}

// ── Reactivación ─────────────────────────────────────────────────────────────

/**
 * Re-habilita SOLO lo que la suspensión por plan apagó (suspendedByPlan==true),
 * limpiando la marca. No reactiva nada que el admin hubiera desactivado a mano.
 * El llamador (webhook) es responsable de fijar la nueva expiración del plan.
 */
export async function reactivateInstitution(
  db: Firestore,
  institutionId: string,
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const del = admin.firestore.FieldValue.delete();

  await db.collection('institutions').doc(institutionId).set(
    { status: 'active', suspendedReason: del, pastDueSince: del, reactivatedAt: now, updatedAt: now },
    { merge: true },
  );

  const restore = { isActive: true, suspendedByPlan: del, disabledReason: del, updatedAt: now };
  const restoreSimple = { isActive: true, suspendedByPlan: del, updatedAt: now };

  await patchAll(
    db,
    db.collection('users').where('institutionId', '==', institutionId).where('suspendedByPlan', '==', true),
    restore,
  );
  await patchAll(
    db,
    db.collection('memberships').where('institutionId', '==', institutionId).where('suspendedByPlan', '==', true),
    restoreSimple,
  );
  await patchAll(
    db,
    db.collection('courses').where('institutionId', '==', institutionId).where('suspendedByPlan', '==', true),
    restoreSimple,
  );
  await patchAll(
    db,
    db.collection('sedes').where('institutionId', '==', institutionId).where('suspendedByPlan', '==', true),
    restoreSimple,
  );
}
