/**
 * POST /api/checkout/licencia-sst
 *
 * Inicia el pago de 30 días de una licencia SST. El monto se resuelve en servidor
 * y la licencia solo se activa cuando el webhook de Wompi confirma APPROVED.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LicenciaSSTCheckoutRequestSchema, parseBody } from '@/lib/schemas';
import { authenticateBuyer, startProductCheckout } from '@/lib/product-checkout';
import { quoteSstLicense } from '@/lib/product-pricing';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const buyer = await authenticateBuyer(req, 'checkout-licencia-sst');
  if (buyer instanceof NextResponse) return buyer;

  const parsed = await parseBody(req, LicenciaSSTCheckoutRequestSchema);
  if (parsed.error) return parsed.error;
  const { planSlug, profile } = parsed.data;

  const quote = quoteSstLicense(planSlug);
  if (!quote) return NextResponse.json({ error: 'Plan SST no válido.' }, { status: 400 });

  return startProductCheckout(req, {
    buyer,
    quote,
    type: 'sst_license',
    returnType: 'licencia-sst',
    description: `Licencia ${quote.name} por 30 días`,
    profile,
    metadata: { planSlug },
  });
}
