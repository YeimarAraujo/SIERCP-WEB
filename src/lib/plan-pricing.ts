/**
 * Precio del alta de un plan, resuelto en servidor con las mismas fuentes y la
 * misma fórmula que muestra el checkout: pricing_plans (o el catálogo estático)
 * × 12 meses, descuento anual e IVA. El cliente nunca envía el monto.
 */
import { adminDb } from '@/lib/firebase-admin';
import { corporatePlans } from '@/data/planes';
import { IVA_RATE } from '@/app/checkout/_lib';

export interface PlanQuote {
  slug: string;
  name: string;
  subtotalCOP: number;
  ivaCOP: number;
  totalCOP: number;
  amountCents: number;
}

interface PriceSource {
  name: string;
  monthlyCOP: number;
  annualCOP?: number;
  annualDiscountPercent?: number;
}

export function computePlanQuote(slug: string, plan: PriceSource): PlanQuote {
  const full = plan.monthlyCOP * 12;
  const discount = plan.annualDiscountPercent ?? 0;
  const subtotalCOP = plan.annualCOP ?? full - Math.round(full * (discount / 100));
  const ivaCOP = Math.round(subtotalCOP * IVA_RATE);
  const totalCOP = subtotalCOP + ivaCOP;
  return { slug, name: plan.name, subtotalCOP, ivaCOP, totalCOP, amountCents: totalCOP * 100 };
}

/** Devuelve null si el plan no existe o se vende por cotización. */
export async function resolvePlanQuote(slug: string): Promise<PlanQuote | null> {
  const snap = await adminDb.collection('pricing_plans')
    .where('slug', '==', slug)
    .where('category', '==', 'corporativo')
    .limit(5)
    .get();

  const live = snap.docs.map((d) => d.data()).find((d) => d.active && !d.deletedAt);
  if (live) {
    if (live.isContact || !live.monthlyCOP) return null;
    return computePlanQuote(slug, live as unknown as PriceSource);
  }

  // Sin pricing_plans el checkout muestra el catálogo estático: se cobra ese.
  if (!snap.empty) return null;
  const fallback = corporatePlans.find((p) => p.slug === slug);
  if (!fallback || !fallback.monthlyCOP) return null;
  return computePlanQuote(slug, fallback as PriceSource);
}
