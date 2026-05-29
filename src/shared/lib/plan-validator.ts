/**
 * PlanValidator — Enforcement real de límites de plan SIERCP.
 *
 * Uso:
 *   const result = await PlanValidator.canCreate(institutionId, 'admins');
 *   if (!result.allowed) { showUpgradeDialog(result.reason); return; }
 *
 * Flujo:
 *   1. Lee el plan activo de institutions/{id}/planMembership/current
 *   2. Lee el plan config de pricing_plans/{planId} (o usa PLAN_CONFIGS como fallback)
 *   3. Compara el uso actual vs el límite del plan
 *   4. Retorna QuotaResult con allowed, reason y upgrade info
 */

import { doc, getDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { PLAN_CONFIGS, type PlanId, type PlanConfig, type PlanLimits } from '@/shared/constants/plan_config';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type QuotaType = keyof PlanLimits;
export type FeatureKey = keyof PlanConfig['features'];

export interface QuotaResult {
  allowed:      boolean;
  current:      number;
  limit:        number;
  pct:          number;     // % de uso (0-100)
  reason?:      string;     // mensaje para mostrar al usuario
  upgradeTo?:   PlanId;     // plan sugerido si está bloqueado
}

export interface FeatureResult {
  allowed:      boolean;
  reason?:      string;
  upgradeTo?:   PlanId;
}

// ── PlanValidator ─────────────────────────────────────────────────────────────

export const PlanValidator = {

  /**
   * Verifica si una institución puede crear un nuevo recurso del tipo dado.
   * @param institutionId ID de la institución
   * @param quotaType     Tipo de límite a verificar ('admins', 'courses', etc.)
   */
  async canCreate(institutionId: string, quotaType: QuotaType): Promise<QuotaResult> {
    const [planConfig, usage] = await Promise.all([
      this._getPlanConfig(institutionId),
      this._getCurrentUsage(institutionId, quotaType),
    ]);

    const limit = planConfig.limits[quotaType];

    // Enterprise (limit = 999999) siempre permitido
    if (limit >= 999999) {
      return { allowed: true, current: usage, limit, pct: 0 };
    }

    const allowed = usage < limit;
    const pct     = Math.min(100, Math.round((usage / limit) * 100));

    return {
      allowed,
      current:   usage,
      limit,
      pct,
      reason:    allowed ? undefined : _blockMessage(quotaType, limit, planConfig.name),
      upgradeTo: allowed ? undefined : _nextPlan(planConfig.id),
    };
  },

  /**
   * Verifica si la institución tiene acceso a una feature según su plan.
   */
  async hasFeature(institutionId: string, feature: FeatureKey): Promise<FeatureResult> {
    const planConfig = await this._getPlanConfig(institutionId);
    const allowed    = planConfig.features[feature] === true;

    return {
      allowed,
      reason:    allowed ? undefined : `Tu plan "${planConfig.name}" no incluye esta funcionalidad.`,
      upgradeTo: allowed ? undefined : _nextPlan(planConfig.id),
    };
  },

  /**
   * Devuelve el uso actual de todos los quotas de una institución.
   * Útil para mostrar indicadores de uso en el dashboard.
   */
  async getUsageSummary(institutionId: string): Promise<Record<QuotaType, QuotaResult>> {
    const planConfig = await this._getPlanConfig(institutionId);
    const quotaTypes: QuotaType[] = ['admins', 'branches', 'employees', 'courses', 'storage_gb', 'manikins'];

    const results = await Promise.all(
      quotaTypes.map(async (qt) => {
        const usage = await this._getCurrentUsage(institutionId, qt);
        const limit = planConfig.limits[qt];
        const pct   = limit >= 999999 ? 0 : Math.min(100, Math.round((usage / limit) * 100));
        return [qt, { allowed: usage < limit, current: usage, limit, pct }] as const;
      }),
    );

    return Object.fromEntries(results) as Record<QuotaType, QuotaResult>;
  },

  // ── Helpers privados ────────────────────────────────────────────────────────

  async _getPlanConfig(institutionId: string): Promise<PlanConfig> {
    try {
      // Leer plan activo de institutions/{id}/planMembership/current
      const planSnap = await getDoc(
        doc(db, 'institutions', institutionId, 'planMembership', 'current'),
      );
      const planId = planSnap.data()?.planId as PlanId | undefined;

      if (planId && PLAN_CONFIGS[planId]) {
        // Intentar leer configuración desde Firestore (permite editarla desde SA)
        const configSnap = await getDoc(doc(db, 'pricing_plans', planId)).catch(() => null);
        if (configSnap?.exists()) {
          return { ...PLAN_CONFIGS[planId], ...configSnap.data() } as PlanConfig;
        }
        return PLAN_CONFIGS[planId];
      }
    } catch {
      // Si falla, usar plan free como fallback seguro
    }
    return PLAN_CONFIGS['free'];
  },

  async _getCurrentUsage(institutionId: string, quotaType: QuotaType): Promise<number> {
    try {
      switch (quotaType) {
        case 'admins': {
          const q = query(
            collection(db, 'memberships'),
            where('institutionId', '==', institutionId),
            where('role', 'in', ['ADMIN', 'INSTRUCTOR']),
            where('isActive', '==', true),
          );
          const snap = await getCountFromServer(q);
          return snap.data().count;
        }
        case 'courses': {
          const q = query(
            collection(db, 'courses'),
            where('institutionId', '==', institutionId),
            where('isActive', '==', true),
          );
          const snap = await getCountFromServer(q);
          return snap.data().count;
        }
        case 'employees': {
          const q = query(
            collection(db, 'memberships'),
            where('institutionId', '==', institutionId),
            where('isActive', '==', true),
          );
          const snap = await getCountFromServer(q);
          return snap.data().count;
        }
        case 'branches': {
          const q = query(
            collection(db, 'sedes'),
            where('institutionId', '==', institutionId),
            where('isActive', '==', true),
          );
          const snap = await getCountFromServer(q);
          return snap.data().count;
        }
        case 'manikins': {
          const q = query(
            collection(db, 'manikins'),
            where('institutionId', '==', institutionId),
          );
          const snap = await getCountFromServer(q);
          return snap.data().count;
        }
        case 'storage_gb':
          // Storage usage se calcula desde Firebase Storage o un campo en institutions
          return 0; // TODO: implementar con Cloud Function
        default:
          return 0;
      }
    } catch {
      return 0;
    }
  },
};

// ── Helpers locales ────────────────────────────────────────────────────────────

function _blockMessage(quotaType: QuotaType, limit: number, planName: string): string {
  const resourceNames: Record<QuotaType, string> = {
    admins:     'administradores',
    branches:   'sedes',
    employees:  'empleados',
    courses:    'cursos activos',
    storage_gb: 'GB de almacenamiento',
    manikins:   'maniquíes',
  };
  return `Tu plan "${planName}" permite máximo ${limit} ${resourceNames[quotaType]}. Actualiza tu plan para continuar.`;
}

function _nextPlan(currentId: PlanId): PlanId | undefined {
  const order: PlanId[] = ['free', 'sst', 'pyme', 'business', 'corporate', 'enterprise'];
  const idx = order.indexOf(currentId);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : undefined;
}

// ── Hook de React para uso en UI ───────────────────────────────────────────────

export { usePlanQuota } from '@/shared/hooks/use-plan-quota';
