/**
 * Runtime validation schemas for all API endpoints.
 * Using Zod to validate incoming JSON at the boundary before any business logic.
 */

import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

const email = z
  .string()
  .min(1, 'Email requerido')
  .email('Email inválido')
  .max(254, 'Email demasiado largo');

const nonEmptyString = z.string().min(1).max(500);

// ── POST /api/wompi ───────────────────────────────────────────────────────────

export const WompiRequestSchema = z.object({
  customer_email: email,
  acceptance_token: z.string().min(10, 'acceptance_token inválido').max(2000),
  payment_method: z.object({ type: z.string().min(1) }).passthrough(),
  customer_data: z.object({
    phone_number: z.string().min(7).max(20),
    full_name: z.string().min(2).max(120),
    legal_id: z.string().min(4).max(20),
    legal_id_type: z.enum(['CC', 'CE', 'NIT', 'PP', 'TI', 'DIE']),
  }),
  curso_slug: z.string().max(80).optional(),
  cohort_id: z.string().max(80).optional(),
  template_id: z.string().max(80).optional(),
  institution_id: z.string().max(80).optional(),
  grupo_id: z.string().max(80).optional(),
}).refine(
  (d) => d.curso_slug || d.cohort_id || d.template_id,
  { message: 'Se requiere curso_slug, cohort_id o template_id para identificar el curso' },
);

export type WompiRequestBody = z.infer<typeof WompiRequestSchema>;

// ── POST /api/enrollment ──────────────────────────────────────────────────────

export const EnrollmentRequestSchema = z.object({
  email: email,
  nombre: nonEmptyString,
  cursoSlug: nonEmptyString,
  telefono: z.string().max(20).optional().default(''),
  cohortId: z.string().max(80).optional().default(''),
  templateId: z.string().max(80).optional().default(''),
  institutionId: z.string().max(80).optional().default(''),
  paymentId: z.string().max(80).optional().default(''),
  paymentMethod: z.string().max(30).optional().default('CARD'),
  amountPaid: z.number().nonnegative().optional().default(0),
  grupoId: z.string().max(80).optional().default(''),
});

export type EnrollmentRequestBody = z.infer<typeof EnrollmentRequestSchema>;

// ── POST /api/wompi-webhook ───────────────────────────────────────────────────

const WompiTransactionSchema = z.object({
  id: z.string().min(1).max(100),
  reference: z.string().min(1).max(200),
  status: z.enum(['PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR']),
  amount_in_cents: z.number().int().positive(),
  currency: z.string().length(3),
  payment_method_type: z.string().max(20),
  customer_email: z.string().email().max(254).optional().default(''),
  finalized_at: z.string().nullable().optional(),
  error_code: z.string().nullable().optional(),
  status_message: z.string().nullable().optional(),
});

export const WompiWebhookSchema = z.object({
  event: z.string().min(1).max(80),
  data: z.object({ transaction: WompiTransactionSchema }),
  timestamp: z.number().int().positive(),
  environment: z.enum(['test', 'production']),
  signature: z.object({
    checksum: z.string().min(10),
    properties: z.array(z.string()).min(1).max(10),
  }),
  // sent_at is optional in some Wompi versions
  sent_at: z.string().optional(),
});

export type WompiWebhookPayload = z.infer<typeof WompiWebhookSchema>;

// ── POST /api/checkout/manikin ────────────────────────────────────────────────

const shippingAddressSchema = z.object({
  address:    z.string().min(5, 'Dirección requerida').max(200),
  city:       z.string().min(2, 'Ciudad requerida').max(80),
  department: z.string().min(2, 'Departamento requerido').max(80),
  postalCode: z.string().max(10).optional().default(''),
  country:    z.literal('CO'),
});

export const ManikinCheckoutRequestSchema = z.object({
  packSlug:        z.enum(['unidad', 'pack-4', 'pack-8']),
  buyerName:       z.string().min(3, 'Nombre requerido').max(120),
  buyerEmail:      email,
  buyerPhone:      z.string().min(7, 'Teléfono requerido').max(20),
  shippingAddress: shippingAddressSchema,
  discountCode:    z.string().max(30).nullable().optional(),
  discountCents:   z.number().int().nonnegative().optional().default(0),
});

export type ManikinCheckoutRequestBody = z.infer<typeof ManikinCheckoutRequestSchema>;

// ── POST /api/checkout/licencia-sst ──────────────────────────────────────────

export const LicenciaSSTCheckoutRequestSchema = z.object({
  planSlug:      z.enum(['sst-basico', 'sst-pro', 'sst-expert']),
  discountCode:  z.string().max(30).nullable().optional(),
  discountCents: z.number().int().nonnegative().optional().default(0),
});

export type LicenciaSSTCheckoutRequestBody = z.infer<typeof LicenciaSSTCheckoutRequestSchema>;

// ── POST /api/checkout/pack ───────────────────────────────────────────────────

export const PackCheckoutRequestSchema = z.object({
  packSlug:      z.enum(['pack-5', 'pack-15', 'pack-40']),
  discountCode:  z.string().max(30).nullable().optional(),
  discountCents: z.number().int().nonnegative().optional().default(0),
});

export type PackCheckoutRequestBody = z.infer<typeof PackCheckoutRequestSchema>;

// ── POST /api/checkout/plan ───────────────────────────────────────────────────

export const PlanCheckoutRequestSchema = z.object({
  planType: z.enum(['pyme', 'business', 'corporate', 'enterprise', 'sstSinLicencia', 'sstConLicencia']),
  institutionName: z.string().min(2, 'Nombre requerido').max(120),
  institutionNit: z
    .string()
    .regex(/^\d{7,10}(-\d)?$/, 'NIT inválido — ej: 900123456 o 900123456-1'),
  institutionCity: z.string().min(2, 'Ciudad requerida').max(80),
  institutionType: z.enum(['empresa', 'hospital', 'clinica', 'universidad', 'otro']),
  adminEmail: email,
  adminFirstName: z.string().min(2, 'Nombre requerido').max(80),
  adminLastName: z.string().min(2, 'Apellido requerido').max(80),
  adminPhone: z.string().min(7).max(20).optional().default(''),
});

export type PlanCheckoutRequestBody = z.infer<typeof PlanCheckoutRequestSchema>;

// ── Validation helper ─────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

/**
 * Parses and validates an API request body against a Zod schema.
 * Returns `{ data }` on success or `{ error: NextResponse }` on failure.
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await (req as Request).json();
  } catch {
    return {
      error: NextResponse.json(
        { error: 'JSON inválido en el cuerpo de la solicitud.' },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return {
      error: NextResponse.json(
        { error: 'Datos inválidos', details: messages },
        { status: 400 },
      ),
    };
  }

  return { data: result.data };
}
