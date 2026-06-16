/**
 * Helper server-side para crear payment links de Wompi (Spark — lógica en Vercel,
 * no en Cloud Functions). El monto se resuelve SIEMPRE en servidor.
 */

function wompiBase(): string {
  return process.env.WOMPI_ENV === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';
}

export async function createWompiPaymentLink(params: {
  name: string;
  description: string;
  amountCents: number;
  redirectUrl: string;
}): Promise<{ id: string; url: string }> {
  const key = process.env.WOMPI_PRIVATE_KEY;
  if (!key) throw new Error('WOMPI_PRIVATE_KEY no configurada');

  const res = await fetch(`${wompiBase()}/payment_links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      single_use: true,
      collect_shipping: false,
      currency: 'COP',
      amount_in_cents: params.amountCents,
      redirect_url: params.redirectUrl,
    }),
  });
  if (!res.ok) {
    console.error('[wompi-link] API error', res.status, await res.text());
    throw new Error('No se pudo crear el enlace de pago');
  }
  const data = (await res.json()) as {
    data: { id: string; url?: string; payment_link?: { id: string; url: string } };
  };
  const id = data.data.id;
  const url = data.data.url ?? data.data.payment_link?.url ?? `https://checkout.wompi.co/l/${id}`;
  return { id, url };
}

export const PLAN_PRICES_COP_CENTS: Record<string, number> = {
  pyme: 35_000_000,
  business: 70_000_000,
  corporate: 150_000_000,
  enterprise: 300_000_000,
  sstSinLicencia: 20_000_000,
  sstConLicencia: 45_000_000,
};
