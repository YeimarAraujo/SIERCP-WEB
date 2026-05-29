/**
 * Configuración de planes SIERCP.
 * Estos valores son la referencia para pricing_plans/{planId} en Firestore.
 * El panel SA puede editarlos desde la base de datos; este archivo sirve
 * como fallback y documentación del contrato de datos.
 */

export type PlanId = 'free' | 'sst' | 'pyme' | 'business' | 'corporate' | 'enterprise';

export interface PlanLimits {
  admins:       number;
  branches:     number;
  employees:    number;
  courses:      number;
  storage_gb:   number;
  manikins:     number;
}

export interface PlanFeatures {
  multi_branch:       boolean;
  advanced_reports:   boolean;
  api_access:         boolean;
  bulk_import:        boolean;
  custom_branding:    boolean;
  live_monitoring:    boolean;
  certificates:       boolean;
  leaderboard:        boolean;
  export_pdf:         boolean;
}

export interface PlanConfig {
  id:                     PlanId;
  name:                   string;
  annual_price:           number;   // COP, precio base anual
  monthly_premium_pct:    number;   // % adicional si pagan mensual (ej: 20 = +20%)
  limits:                 PlanLimits;
  features:               PlanFeatures;
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    annual_price: 0,
    monthly_premium_pct: 0,
    limits: {
      admins: 1, branches: 1, employees: 5,
      courses: 2, storage_gb: 1, manikins: 1,
    },
    features: {
      multi_branch: false, advanced_reports: false, api_access: false,
      bulk_import: false, custom_branding: false, live_monitoring: false,
      certificates: false, leaderboard: false, export_pdf: false,
    },
  },

  sst: {
    id: 'sst',
    name: 'SST',
    annual_price: 480000,
    monthly_premium_pct: 15,
    limits: {
      admins: 2, branches: 1, employees: 20,
      courses: 5, storage_gb: 5, manikins: 2,
    },
    features: {
      multi_branch: false, advanced_reports: false, api_access: false,
      bulk_import: true, custom_branding: false, live_monitoring: true,
      certificates: true, leaderboard: true, export_pdf: true,
    },
  },

  pyme: {
    id: 'pyme',
    name: 'Pyme',
    annual_price: 1200000,
    monthly_premium_pct: 20,
    limits: {
      admins: 10, branches: 10, employees: 50,
      courses: 20, storage_gb: 10, manikins: 5,
    },
    features: {
      multi_branch: true, advanced_reports: true, api_access: false,
      bulk_import: true, custom_branding: false, live_monitoring: true,
      certificates: true, leaderboard: true, export_pdf: true,
    },
  },

  business: {
    id: 'business',
    name: 'Business',
    annual_price: 2400000,
    monthly_premium_pct: 20,
    limits: {
      admins: 25, branches: 25, employees: 200,
      courses: 50, storage_gb: 50, manikins: 15,
    },
    features: {
      multi_branch: true, advanced_reports: true, api_access: true,
      bulk_import: true, custom_branding: true, live_monitoring: true,
      certificates: true, leaderboard: true, export_pdf: true,
    },
  },

  corporate: {
    id: 'corporate',
    name: 'Corporativo',
    annual_price: 4800000,
    monthly_premium_pct: 20,
    limits: {
      admins: 50, branches: 50, employees: 500,
      courses: 100, storage_gb: 100, manikins: 30,
    },
    features: {
      multi_branch: true, advanced_reports: true, api_access: true,
      bulk_import: true, custom_branding: true, live_monitoring: true,
      certificates: true, leaderboard: true, export_pdf: true,
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    annual_price: 0,  // precio negociado
    monthly_premium_pct: 0,
    limits: {
      admins: 999999, branches: 999999, employees: 999999,
      courses: 999999, storage_gb: 999999, manikins: 999999,
    },
    features: {
      multi_branch: true, advanced_reports: true, api_access: true,
      bulk_import: true, custom_branding: true, live_monitoring: true,
      certificates: true, leaderboard: true, export_pdf: true,
    },
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Precio mensual efectivo si el cliente paga mensualmente (con premium). */
export function monthlyPrice(plan: PlanConfig): number {
  const base = plan.annual_price / 12;
  return Math.ceil(base * (1 + plan.monthly_premium_pct / 100));
}

/** Precio mensual equivalente si el cliente paga el año completo. */
export function monthlyEquivalent(plan: PlanConfig): number {
  return Math.ceil(plan.annual_price / 12);
}

/** Ahorro total pagando anual vs mensual (12 cuotas con premium). */
export function annualSavings(plan: PlanConfig): number {
  if (plan.annual_price === 0) return 0;
  const totalMonthly = monthlyPrice(plan) * 12;
  return totalMonthly - plan.annual_price;
}

/** Verifica si una institución supera un límite dado. */
export function isOverLimit(
  usage: Partial<PlanLimits>,
  limits: PlanLimits,
  key: keyof PlanLimits
): boolean {
  return (usage[key] ?? 0) >= limits[key];
}
