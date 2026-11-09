/**
 * POST /api/checkout/pack
 *
 * Inicia el pago único de un pack de certificados SST. El monto se resuelve en
 * servidor y los certificados se abonan cuando el webhook confirma APPROVED.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PackCheckoutRequestSchema, parseBody } from '@/lib/schemas';
import { authenticateBuyer, startProductCheckout } from '@/lib/product-checkout';
import { quoteSstPack } from '@/lib/product-pricing';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const buyer = await authenticateBuyer(req, 'checkout-pack');
  if (buyer instanceof NextResponse) return buyer;

  const parsed = await parseBody(req, PackCheckoutRequestSchema);
  if (parsed.error) return parsed.error;
  const { packSlug, profile } = parsed.data;

  const quote = quoteSstPack(packSlug);
  if (!quote) return NextResponse.json({ error: 'Pack no válido.' }, { status: 400 });

  return startProductCheckout(req, {
    buyer,
    quote,
    type: 'pack_purchase',
    returnType: 'pack',
    description: `${quote.name} (pago único)`,
    profile,
    metadata: { packSlug, isRecurring: false },
  });
}
