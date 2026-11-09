/**
 * Precios de maniquíes, licencias SST y packs, con la misma fuente y fórmula que
 * muestran sus páginas de compra (data/planes + IVA). El cliente no envía montos.
 */
import { maniquiPackages, sstConLicenciaPlans, sstSinLicenciaPlans } from '@/data/planes';
import { IVA_RATE } from '@/app/checkout/_lib';

export interface ProductQuote {
  slug: string;
  name: string;
  subtotalCOP: number;
  totalCOP: number;
  amountCents: number;
}

function quote(slug: string, name: string, subtotalCOP: number | null | undefined): ProductQuote | null {
  if (!subtotalCOP) return null;
  const totalCOP = Math.round(subtotalCOP * (1 + IVA_RATE));
  return { slug, name, subtotalCOP, totalCOP, amountCents: totalCOP * 100 };
}

export function quoteManikin(slug: string): ProductQuote | null {
  const pack = maniquiPackages.find((p) => p.slug === slug);
  return pack ? quote(slug, `Maniquíes SIERCP — ${pack.name}`, pack.totalPriceCOP) : null;
}

export function quoteSstLicense(slug: string): ProductQuote | null {
  const plan = sstConLicenciaPlans.find((p) => p.slug === slug);
  return plan ? quote(slug, plan.name, plan.monthlyCOP) : null;
}

export function quoteSstPack(slug: string): ProductQuote | null {
  const pack = sstSinLicenciaPlans.find((p) => p.slug === slug);
  return pack ? quote(slug, `${pack.name} de certificados SST`, pack.monthlyCOP) : null;
}

/** Certificados incluidos en un pack, según su slug (`pack-15` → 15). */
export function packCertificates(slug: string): number {
  const match = /^pack-(\d+)$/.exec(slug);
  return match ? Number(match[1]) : 0;
}
