/**
 * Validaciones Zod para Colombia.
 * Única fuente de verdad — reutilizada por frontend y backend.
 */

import { z } from 'zod';

// ── Primitivos reutilizables ────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, 'Email requerido')
  .email('Email inválido')
  .max(254, 'Email demasiado largo');

export const colombianPhoneSchema = z
  .string()
  .min(1, 'Teléfono requerido')
  .regex(
    /^\+?57\s?3\d{2}\s?\d{3}\s?\d{4}$|^3\d{9}$/,
    'Debe ser un celular colombiano válido (+57 3XX XXX XXXX o 3XXXXXXXXX)',
  );

export const documentTypeSchema = z.enum(['CC', 'CE', 'NIT', 'PP', 'TI', 'DIE']);

export const ccSchema = z
  .string()
  .min(1, 'Número de documento requerido')
  .regex(/^\d{6,10}$/, 'Cédula inválida (6 a 10 dígitos)');

export const nitSchema = z
  .string()
  .min(1, 'NIT requerido')
  .regex(/^\d{7,10}(-\d)?$/, 'NIT inválido — ej: 900123456 o 900123456-1');

export const colombianDepartmentSchema = z.enum([
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada', 'Bogotá D.C.',
]);

export type ColombiaDepartment = z.infer<typeof colombianDepartmentSchema>;

export const COLOMBIA_DEPARTMENTS: ColombiaDepartment[] = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada', 'Bogotá D.C.',
];

// ── Datos de comprador persona natural ────────────────────────────────────────

export const buyerPersonaSchema = z.object({
  firstName: z.string().min(2, 'Nombre requerido').max(80),
  lastName: z.string().min(2, 'Apellido requerido').max(80),
  documentType: documentTypeSchema,
  documentNumber: z.string().min(4, 'Documento requerido').max(20),
  email: emailSchema,
  phone: colombianPhoneSchema,
});

export type BuyerPersona = z.infer<typeof buyerPersonaSchema>;

// ── Datos de empresa ──────────────────────────────────────────────────────────

export const buyerEmpresaSchema = z.object({
  razonSocial: z.string().min(2, 'Razón social requerida').max(120),
  nit: nitSchema,
  representanteLegal: z.string().min(2, 'Representante legal requerido').max(120),
  email: emailSchema,
  phone: colombianPhoneSchema,
});

export type BuyerEmpresa = z.infer<typeof buyerEmpresaSchema>;

// ── Dirección de envío (Colombia únicamente) ──────────────────────────────────

export const shippingAddressSchema = z.object({
  recipientName: z.string().min(2, 'Nombre del destinatario requerido').max(120),
  recipientPhone: colombianPhoneSchema,
  department: colombianDepartmentSchema,
  city: z.string().min(2, 'Ciudad requerida').max(80),
  address: z.string().min(5, 'Dirección requerida').max(200),
  neighborhood: z.string().max(80).optional(),
  postalCode: z.string().regex(/^\d{4,6}$/, 'Código postal inválido').optional().or(z.literal('')),
  instructions: z.string().max(250, 'Máximo 250 caracteres').optional(),
  shippingMethod: z.enum(['estandar', 'express', 'recogida']).default('estandar'),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// ── Beneficiario de plan SST ──────────────────────────────────────────────────

export const beneficiarioSchema = z.object({
  firstName: z.string().min(2, 'Nombre requerido').max(80),
  lastName: z.string().min(2, 'Apellido requerido').max(80),
  documentType: documentTypeSchema,
  documentNumber: z.string().min(4, 'Documento requerido').max(20),
  email: emailSchema,
  phone: colombianPhoneSchema,
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
  department: colombianDepartmentSchema,
  city: z.string().min(2, 'Ciudad requerida').max(80),
  occupation: z.string().max(100).optional(),
  isSelfBeneficiary: z.boolean().default(true),
});

export type Beneficiario = z.infer<typeof beneficiarioSchema>;

// ── Datos de facturación ──────────────────────────────────────────────────────

export const invoiceSchema = z.object({
  invoiceType: z.enum(['persona_natural', 'empresa']),
  name: z.string().min(2).max(120),
  documentType: documentTypeSchema,
  documentNumber: z.string().min(4).max(20),
  email: emailSchema,
  phone: colombianPhoneSchema.optional().or(z.literal('')),
  address: z.string().min(5).max(200).optional(),
  city: z.string().min(2).max(80).optional(),
  department: colombianDepartmentSchema.optional(),
});

export type InvoiceDetails = z.infer<typeof invoiceSchema>;

// ── Validador de dígito de verificación NIT ──────────────────────────────────

export function calcNitDv(nit: string): number {
  const digits = nit.replace(/\D/g, '');
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[digits.length - 1 - i]) * weights[i];
  }
  const rem = sum % 11;
  return rem < 2 ? rem : 11 - rem;
}

// ── Formateadores ─────────────────────────────────────────────────────────────

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('57')) {
    const local = digits.slice(2);
    return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 10)}`.trim();
  }
  if (digits.length === 10) {
    return `+57 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim();
  }
  return raw;
}
