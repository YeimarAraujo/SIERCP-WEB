/**
 * POST /api/checkout/manikin
 *
 * Inicia la compra de maniquíes. El monto se resuelve en servidor y el pedido
 * solo aparece en `orders` cuando el webhook firmado de Wompi confirma APPROVED.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ManikinCheckoutRequestSchema, parseBody } from '@/lib/schemas';
import { authenticateBuyer, startProductCheckout } from '@/lib/product-checkout';
import { quoteManikin } from '@/lib/product-pricing';
import { maniquiPackages } from '@/data/planes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const buyer = await authenticateBuyer(req, 'checkout-manikin');
  if (buyer instanceof NextResponse) return buyer;

  const parsed = await parseBody(req, ManikinCheckoutRequestSchema);
  if (parsed.error) return parsed.error;
  const { packSlug, buyerType, buyerName, buyerDocument, buyerPhone, shippingAddress, profile } = parsed.data;

  const quote = quoteManikin(packSlug);
  if (!quote) return NextResponse.json({ error: 'Paquete no válido.' }, { status: 400 });

  return startProductCheckout(req, {
    buyer,
    quote,
    type: 'manikin_purchase',
    returnType: 'manikin',
    description: `Compra de ${quote.name}. Envío gratis a ${shippingAddress.city}.`,
    profile,
    metadata: {
      packSlug,
      quantity: maniquiPackages.find((p) => p.slug === packSlug)?.quantity ?? 1,
      buyerType,
      buyer: {
        ...(buyerType === 'empresa' ? { razonSocial: buyerName } : { nombre: buyerName }),
        email: buyer.email,
        telefono: buyerPhone,
        documento: buyerDocument,
      },
      shippingAddress,
    },
  });
}
