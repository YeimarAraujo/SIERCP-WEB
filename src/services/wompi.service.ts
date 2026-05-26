
const WOMPI_API_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!;

export type WompiCurrency = 'COP';
export type WompiPaymentMethodType = 'CARD' | 'PSE' | 'BANCOLOMBIA_TRANSFER' | 'NEQUI';
export type WompiTransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
export type WompiPersonType = 0 | 1; // 0 = Natural, 1 = Jurídica
export type WompiLegalIdType = 'CC' | 'CE' | 'NIT' | 'PP' | 'TI';

export interface WompiAcceptanceToken {
  acceptance_token: string;
  permalink: string;
  type: 'END_USER_POLICY';
}

export interface WompiMerchant {
  id: number;
  name: string;
  legal_name: string;
  contact_name: string;
  phone_number: string;
  logo_url: string | null;
  legal_id_type: string;
  email: string;
  presigned_acceptance: WompiAcceptanceToken;
}

export interface WompiCardTokenRequest {
  number: string;       // PAN sin espacios
  cvc: string;
  exp_month: string;    // "MM"
  exp_year: string;     // "YY"
  card_holder: string;
}

export interface WompiCardToken {
  id: string;           // "tok_test_xxx"
  created_at: string;
  brand: string;        // "VISA" | "MASTERCARD" | etc.
  name: string;
  last_four: string;
  bin: string;
  exp_year: string;
  exp_month: string;
  card_holder: string;
  expires_at: string;
}

export interface WompiPSEPaymentMethod {
  type: 'PSE';
  user_type: WompiPersonType;
  user_legal_id_type: WompiLegalIdType;
  user_legal_id: string;
  financial_institution_code: string;
  payment_description: string;
}

export interface WompiCardPaymentMethod {
  type: 'CARD';
  token: string;        // "tok_test_xxx"
  installments: number; // 1 para contado
}

export interface WompiNequiPaymentMethod {
  type: 'NEQUI';
  phone_number: string; // "3001234567"
}

export type WompiPaymentMethodPayload =
  | WompiPSEPaymentMethod
  | WompiCardPaymentMethod
  | WompiNequiPaymentMethod;

export interface WompiCustomerData {
  phone_number: string;
  full_name: string;
  legal_id: string;
  legal_id_type: WompiLegalIdType;
}

export interface WompiTransactionRequest {
  amount_in_cents: number;
  currency: WompiCurrency;
  customer_email: string;
  payment_method: WompiPaymentMethodPayload;
  reference: string;
  customer_data: WompiCustomerData;
  redirect_url?: string;      // Requerido para PSE y NEQUI
  acceptance_token: string;
  signature?: string;         // Firma de integridad SHA-256
}

export interface WompiTransaction {
  id: string;
  created_at: string;
  finalized_at: string | null;
  amount_in_cents: number;
  reference: string;
  customer_email: string;
  currency: string;
  payment_method_type: WompiPaymentMethodType;
  payment_method: Record<string, unknown>;
  status: WompiTransactionStatus;
  status_message: string | null;
  redirect_url: string | null;
  payment_source_id: string | null;
  payment_link_id: string | null;
  error_code: string | null;
}

export interface WompiFinancialInstitution {
  financial_institution_code: string;
  financial_institution_name: string;
}

// ─── Client-side API helpers ────────────────────────────────────────────────

/**
 * Obtiene el merchant y el acceptance_token de Wompi.
 * El acceptance_token tiene una vida útil corta, siempre obtenerlo antes de una transacción.
 */
export async function getMerchantInfo(): Promise<WompiMerchant> {
  const res = await fetch(`${WOMPI_API_BASE}/merchants/${WOMPI_PUBLIC_KEY}`);
  if (!res.ok) throw new Error('No se pudo obtener la información del comercio Wompi');
  const { data } = await res.json();
  return data as WompiMerchant;
}

/**
 * Tokeniza una tarjeta directamente en el cliente — NUNCA envíes datos de tarjeta a tu servidor.
 * Devuelve un token efímero ("tok_xxx") que luego se usa en la transacción.
 * Cumple con PCI-DSS SAQ-A al no pasar datos sensibles por tu backend.
 */
export async function tokenizeCard(card: WompiCardTokenRequest): Promise<WompiCardToken> {
  // Validaciones mínimas del lado cliente antes de llamar a Wompi
  const pan = card.number.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(pan)) throw new Error('Número de tarjeta inválido');
  if (!/^\d{3,4}$/.test(card.cvc)) throw new Error('CVC inválido');
  if (!/^\d{2}$/.test(card.exp_month) || +card.exp_month < 1 || +card.exp_month > 12)
    throw new Error('Mes de expiración inválido');
  if (!/^\d{2}$/.test(card.exp_year)) throw new Error('Año de expiración inválido');

  const res = await fetch(`${WOMPI_API_BASE}/tokens/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
    },
    body: JSON.stringify({ ...card, number: pan }),
  });

  const json = await res.json();
  if (!res.ok) {
    const messages = json?.error?.messages;
    const msg = messages
      ? Object.values(messages).flat().join('. ')
      : json?.error?.reason || 'Error al tokenizar la tarjeta';
    throw new Error(msg);
  }
  return json.data as WompiCardToken;
}

/**
 * Carga la lista de entidades financieras habilitadas para PSE.
 * Se recomienda cachear esta lista (cambia poco) pero renovarla periódicamente.
 */
export async function getPSEFinancialInstitutions(): Promise<WompiFinancialInstitution[]> {
  const res = await fetch(`${WOMPI_API_BASE}/pse/financial_institutions`, {
    headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` },
  });
  if (!res.ok) throw new Error('No se pudieron cargar los bancos habilitados para PSE');
  const { data } = await res.json();
  return data as WompiFinancialInstitution[];
}

/**
 * Consulta el estado actual de una transacción por su ID de Wompi.
 */
export async function getTransactionStatus(transactionId: string): Promise<WompiTransaction> {
  const res = await fetch(`${WOMPI_API_BASE}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` },
  });
  if (!res.ok) throw new Error('No se pudo consultar el estado de la transacción');
  const { data } = await res.json();
  return data as WompiTransaction;
}

// ─── Reference generator ─────────────────────────────────────────────────────

/**
 * Genera una referencia única por transacción.
 * Wompi la usa para deduplicar: dos transacciones con la misma referencia
 * en estado APPROVED bloquearán la segunda. Úsala para idempotencia.
 */
export function generateTransactionReference(cursoSlug: string, userId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `SIERCP-${cursoSlug.slice(0, 20)}-${userId.slice(0, 10)}-${ts}`.slice(0, 100);
}

// ─── Installments helper ─────────────────────────────────────────────────────

export const INSTALLMENT_OPTIONS = [1, 3, 6, 12, 24, 36] as const;

export function formatInstallmentLabel(n: number, totalCOP: number): string {
  if (n === 1) return 'Contado (sin intereses)';
  const monthly = Math.ceil(totalCOP / n);
  return `${n} cuotas de ${formatCOP(monthly)}`;
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}