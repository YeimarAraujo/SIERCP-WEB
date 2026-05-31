'use client';

import { useEffect, useState, useCallback } from 'react';
import { PlanValidator, type QuotaType, type QuotaResult, type FeatureResult, type FeatureKey } from '@/shared/lib/plan-validator';

// ── useQuotaCheck ─────────────────────────────────────────────────────────────

/**
 * Verifica si una institución puede crear un recurso.
 * Muestra badge de advertencia cuando se acerca al límite.
 *
 * @example
 * const { result, loading } = useQuotaCheck(institutionId, 'courses');
 * if (!result?.allowed) return <UpgradeBanner reason={result.reason} />;
 */
export function useQuotaCheck(
  institutionId: string | null | undefined,
  quotaType: QuotaType,
): { result: QuotaResult | null; loading: boolean; refresh: () => void } {
  const [result, setResult]   = useState<QuotaResult | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      const r = await PlanValidator.canCreate(institutionId, quotaType);
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [institutionId, quotaType]);

  useEffect(() => { void check(); }, [check]);

  return { result, loading, refresh: check };
}

// ── useFeatureGate ─────────────────────────────────────────────────────────────

/**
 * Verifica si la institución tiene acceso a una feature premium.
 *
 * @example
 * const { allowed, loading } = useFeatureGate(institutionId, 'live_monitoring');
 * if (!allowed) return <FeatureLockedBanner />;
 */
export function useFeatureGate(
  institutionId: string | null | undefined,
  feature: FeatureKey,
): { allowed: boolean; result: FeatureResult | null; loading: boolean } {
  const [result, setResult]   = useState<FeatureResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    setLoading(true);
    PlanValidator.hasFeature(institutionId, feature)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [institutionId, feature]);

  return { allowed: result?.allowed ?? true, result, loading };
}

// ── usePlanQuota (re-export name used in plan-validator.ts) ───────────────────

export const usePlanQuota = useQuotaCheck;

// ── useUsageSummary ────────────────────────────────────────────────────────────

/**
 * Devuelve el resumen completo de uso de todos los quotas.
 * Útil para el panel de configuración de la institución.
 */
export function useUsageSummary(institutionId: string | null | undefined) {
  const [summary, setSummary]   = useState<Record<QuotaType, QuotaResult> | null>(null);
  const [loading, setLoading]   = useState(false);

  const refresh = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      const s = await PlanValidator.getUsageSummary(institutionId);
      setSummary(s);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { summary, loading, refresh };
}
