/**
 * Mapa producto → pasos → campos.
 *
 * La CheckoutPage universal recibe un `productKind` y un `productId`,
 * carga esta configuración y renderiza el flujo correcto.
 * No hay lógica por-producto en la UI — todo sale de aquí.
 */

import { z } from 'zod';
import {
  buyerPersonaSchema,
  buyerEmpresaSchema,
  shippingAddressSchema,
  beneficiarioSchema,
  invoiceSchema,
  colombianDepartmentSchema,
  COLOMBIA_DEPARTMENTS,
  documentTypeSchema,
} from '../schemas/shared.schema';

// ── Tipos base ─────────────────────────────────────────────────────────────────

export type ProductKind =
  | 'curso_web'
  | 'curso_software_app'
  | 'plan_sst_individual'
  | 'plan_corporativo'
  | 'pack_maniqui'
  | 'licencia_sst';

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'password'
  | 'select'
  | 'date'
  | 'textarea'
  | 'toggle'
  | 'document_number'
  | 'address_block';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  validation: z.ZodTypeAny;
  colSpan?: 1 | 2;
  options?: SelectOption[];
  mask?: 'phone' | 'nit' | 'card';
  dependsOn?: { field: string; value: unknown };
  hint?: string;
  optional?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyZodObject = z.ZodType<any, any, any>;

export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
  ctaLabel: string;
  schema: AnyZodObject;
  allowGuest?: boolean;
}

export interface CheckoutConfig {
  productKind: ProductKind;
  title: string;
  subtitle: string;
  steps: StepConfig[];
  requiresAuth: boolean;
  allowGuest: boolean;
  showShipping: boolean;
  summaryLabel: string;
}

// ── Opciones reutilizables ────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS: SelectOption[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PP', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de identidad' },
];

const DEPARTMENT_OPTIONS: SelectOption[] = COLOMBIA_DEPARTMENTS.map((d) => ({
  value: d,
  label: d,
}));

const INSTITUTION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'hospital', label: 'Hospital / Clínica' },
  { value: 'clinica', label: 'Clínica especializada' },
  { value: 'universidad', label: 'Universidad / Instituto' },
  { value: 'otro', label: 'Otro' },
];

const SHIPPING_METHOD_OPTIONS: SelectOption[] = [
  { value: 'estandar', label: 'Envío estándar (3-5 días hábiles)' },
  { value: 'express', label: 'Envío express (1-2 días hábiles)' },
  { value: 'recogida', label: 'Recogida en sede' },
];

// ── Configuraciones por tipo de producto ─────────────────────────────────────

const cursoConfig: CheckoutConfig = {
  productKind: 'curso_web',
  title: 'Inscripción al curso',
  subtitle: 'Completa tus datos para reservar tu lugar',
  requiresAuth: true,
  allowGuest: false,
  showShipping: false,
  summaryLabel: 'Resumen del curso',
  steps: [
    {
      id: 'datos_estudiante',
      title: 'Datos del estudiante',
      description: 'Confirma los datos con los que recibirás el certificado',
      ctaLabel: 'Continuar al pago',
      schema: buyerPersonaSchema,
      fields: [
        {
          name: 'firstName',
          label: 'Nombre',
          type: 'text',
          placeholder: 'Tu nombre',
          validation: z.string().min(2, 'Nombre requerido').max(80),
          colSpan: 1,
        },
        {
          name: 'lastName',
          label: 'Apellido',
          type: 'text',
          placeholder: 'Tu apellido',
          validation: z.string().min(2, 'Apellido requerido').max(80),
          colSpan: 1,
        },
        {
          name: 'documentType',
          label: 'Tipo de documento',
          type: 'select',
          options: DOC_TYPE_OPTIONS,
          validation: documentTypeSchema,
          colSpan: 1,
        },
        {
          name: 'documentNumber',
          label: 'Número de documento',
          type: 'document_number',
          placeholder: 'Ej: 1234567890',
          validation: z.string().min(4, 'Documento requerido').max(20),
          colSpan: 1,
        },
        {
          name: 'phone',
          label: 'Teléfono celular',
          type: 'phone',
          placeholder: '+57 300 000 0000',
          mask: 'phone',
          validation: z.string().min(7, 'Teléfono requerido'),
          colSpan: 2,
          hint: 'Recibirás confirmación de inscripción por SMS',
        },
      ],
    },
  ],
};

const planIndividualConfig: CheckoutConfig = {
  productKind: 'plan_sst_individual',
  title: 'Activar plan SST individual',
  subtitle: 'Certificación personal en Seguridad y Salud en el Trabajo',
  requiresAuth: true,
  allowGuest: false,
  showShipping: false,
  summaryLabel: 'Resumen del plan',
  steps: [
    {
      id: 'beneficiario',
      title: '¿Quién se certifica?',
      description: 'El plan se vinculará a este beneficiario',
      ctaLabel: 'Continuar',
      schema: beneficiarioSchema,
      fields: [
        {
          name: 'isSelfBeneficiary',
          label: 'Compro para mí mismo',
          type: 'toggle',
          validation: z.boolean().default(true),
          colSpan: 2,
        },
        {
          name: 'firstName',
          label: 'Nombre del beneficiario',
          type: 'text',
          placeholder: 'Nombre',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'lastName',
          label: 'Apellido',
          type: 'text',
          placeholder: 'Apellido',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'documentType',
          label: 'Tipo de documento',
          type: 'select',
          options: DOC_TYPE_OPTIONS,
          validation: documentTypeSchema,
          colSpan: 1,
        },
        {
          name: 'documentNumber',
          label: 'Número de documento',
          type: 'document_number',
          placeholder: 'Número',
          validation: z.string().min(4).max(20),
          colSpan: 1,
        },
        {
          name: 'email',
          label: 'Email del beneficiario',
          type: 'email',
          placeholder: 'correo@ejemplo.com',
          validation: z.string().email('Email inválido'),
          colSpan: 2,
          hint: 'Este email será el acceso a la plataforma',
        },
        {
          name: 'phone',
          label: 'Teléfono',
          type: 'phone',
          placeholder: '+57 300 000 0000',
          mask: 'phone',
          validation: z.string().min(7),
          colSpan: 1,
        },
        {
          name: 'birthDate',
          label: 'Fecha de nacimiento',
          type: 'date',
          validation: z.string().min(1, 'Requerida'),
          colSpan: 1,
        },
        {
          name: 'department',
          label: 'Departamento',
          type: 'select',
          options: DEPARTMENT_OPTIONS,
          validation: colombianDepartmentSchema,
          colSpan: 1,
        },
        {
          name: 'city',
          label: 'Ciudad',
          type: 'text',
          placeholder: 'Ej: Bogotá',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'occupation',
          label: 'Cargo / Ocupación',
          type: 'text',
          placeholder: 'Ej: Enfermero, Bombero...',
          validation: z.string().max(100).optional(),
          colSpan: 2,
          optional: true,
          hint: 'Opcional. Aparecerá en el certificado.',
        },
      ],
    },
  ],
};

const planCorporativoConfig: CheckoutConfig = {
  productKind: 'plan_corporativo',
  title: 'Plan corporativo',
  subtitle: 'Licencias para tu equipo de trabajo',
  requiresAuth: true,
  allowGuest: false,
  showShipping: false,
  summaryLabel: 'Resumen del plan',
  steps: [
    {
      id: 'empresa',
      title: 'Datos de la empresa',
      description: 'Esta información aparecerá en los certificados corporativos',
      ctaLabel: 'Continuar',
      schema: buyerEmpresaSchema,
      fields: [
        {
          name: 'razonSocial',
          label: 'Razón social',
          type: 'text',
          placeholder: 'Ej: Clínica Los Pinos S.A.S',
          validation: z.string().min(2, 'Razón social requerida').max(120),
          colSpan: 2,
        },
        {
          name: 'nit',
          label: 'NIT',
          type: 'text',
          placeholder: 'Ej: 900123456-1',
          mask: 'nit',
          validation: z.string().regex(/^\d{7,10}(-\d)?$/, 'NIT inválido'),
          colSpan: 1,
        },
        {
          name: 'institutionType',
          label: 'Tipo de institución',
          type: 'select',
          options: INSTITUTION_TYPE_OPTIONS,
          validation: z.enum(['empresa', 'hospital', 'clinica', 'universidad', 'otro']),
          colSpan: 1,
        },
        {
          name: 'representanteLegal',
          label: 'Representante legal',
          type: 'text',
          placeholder: 'Nombre completo',
          validation: z.string().min(2).max(120),
          colSpan: 2,
        },
        {
          name: 'email',
          label: 'Email corporativo',
          type: 'email',
          placeholder: 'admin@tuempresa.com',
          validation: z.string().email('Email inválido'),
          colSpan: 1,
          hint: 'Recibirá las credenciales de administrador',
        },
        {
          name: 'phone',
          label: 'Teléfono',
          type: 'phone',
          placeholder: '+57 300 000 0000',
          mask: 'phone',
          validation: z.string().min(7),
          colSpan: 1,
        },
      ],
    },
  ],
};

const packManikinConfig: CheckoutConfig = {
  productKind: 'pack_maniqui',
  title: 'Pedido de maniquíes',
  subtitle: 'Pago 100% en línea · Envío a Colombia',
  requiresAuth: false,
  allowGuest: true,
  showShipping: true,
  summaryLabel: 'Resumen del pedido',
  steps: [
    {
      id: 'comprador',
      title: 'Datos del comprador',
      description: 'Persona natural o empresa',
      ctaLabel: 'Continuar al envío',
      schema: buyerPersonaSchema,
      fields: [
        {
          name: 'firstName',
          label: 'Nombre',
          type: 'text',
          placeholder: 'Nombre',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'lastName',
          label: 'Apellido',
          type: 'text',
          placeholder: 'Apellido',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'documentType',
          label: 'Tipo de documento',
          type: 'select',
          options: DOC_TYPE_OPTIONS,
          validation: documentTypeSchema,
          colSpan: 1,
        },
        {
          name: 'documentNumber',
          label: 'Número de documento',
          type: 'document_number',
          placeholder: 'Número',
          validation: z.string().min(4).max(20),
          colSpan: 1,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'correo@ejemplo.com',
          validation: z.string().email('Email inválido'),
          colSpan: 2,
        },
        {
          name: 'phone',
          label: 'Teléfono celular',
          type: 'phone',
          placeholder: '+57 300 000 0000',
          mask: 'phone',
          validation: z.string().min(7),
          colSpan: 2,
        },
      ],
    },
    {
      id: 'envio',
      title: 'Dirección de envío',
      description: 'Solo enviamos a Colombia',
      ctaLabel: 'Continuar a facturación',
      schema: shippingAddressSchema,
      fields: [
        {
          name: 'recipientName',
          label: 'Nombre del destinatario',
          type: 'text',
          placeholder: 'Quién recibe el paquete',
          validation: z.string().min(2).max(120),
          colSpan: 2,
        },
        {
          name: 'recipientPhone',
          label: 'Teléfono del destinatario',
          type: 'phone',
          placeholder: '+57 300 000 0000',
          mask: 'phone',
          validation: z.string().min(7),
          colSpan: 2,
        },
        {
          name: 'department',
          label: 'Departamento',
          type: 'select',
          options: DEPARTMENT_OPTIONS,
          validation: colombianDepartmentSchema,
          colSpan: 1,
        },
        {
          name: 'city',
          label: 'Ciudad / Municipio',
          type: 'text',
          placeholder: 'Ej: Medellín',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'address',
          label: 'Dirección',
          type: 'text',
          placeholder: 'Ej: Calle 50 # 32-15',
          validation: z.string().min(5).max(200),
          colSpan: 2,
        },
        {
          name: 'neighborhood',
          label: 'Barrio',
          type: 'text',
          placeholder: 'Nombre del barrio',
          validation: z.string().max(80).optional(),
          colSpan: 1,
          optional: true,
        },
        {
          name: 'postalCode',
          label: 'Código postal',
          type: 'text',
          placeholder: '111221',
          validation: z.string().max(6).optional(),
          colSpan: 1,
          optional: true,
        },
        {
          name: 'shippingMethod',
          label: 'Método de envío',
          type: 'select',
          options: SHIPPING_METHOD_OPTIONS,
          validation: z.enum(['estandar', 'express', 'recogida']),
          colSpan: 2,
        },
        {
          name: 'instructions',
          label: 'Indicaciones para el repartidor',
          type: 'textarea',
          placeholder: 'Ej: Dejar en portería, tocar timbre 2 veces...',
          validation: z.string().max(250).optional(),
          colSpan: 2,
          optional: true,
          hint: 'Máximo 250 caracteres',
        },
      ],
    },
    {
      id: 'facturacion',
      title: 'Datos de facturación',
      description: 'Para tu factura electrónica',
      ctaLabel: 'Continuar al pago',
      schema: invoiceSchema,
      fields: [
        {
          name: 'invoiceType',
          label: 'Facturar como',
          type: 'select',
          options: [
            { value: 'persona_natural', label: 'Persona Natural' },
            { value: 'empresa', label: 'Empresa / Persona Jurídica' },
          ],
          validation: z.enum(['persona_natural', 'empresa']),
          colSpan: 2,
        },
        {
          name: 'name',
          label: 'Nombre / Razón social',
          type: 'text',
          placeholder: 'Como aparecerá en la factura',
          validation: z.string().min(2).max(120),
          colSpan: 2,
        },
        {
          name: 'documentType',
          label: 'Tipo de documento',
          type: 'select',
          options: DOC_TYPE_OPTIONS,
          validation: documentTypeSchema,
          colSpan: 1,
        },
        {
          name: 'documentNumber',
          label: 'Número de documento',
          type: 'document_number',
          placeholder: 'CC o NIT',
          validation: z.string().min(4).max(20),
          colSpan: 1,
        },
        {
          name: 'email',
          label: 'Email para recibir la factura',
          type: 'email',
          placeholder: 'correo@ejemplo.com',
          validation: z.string().email(),
          colSpan: 2,
        },
      ],
    },
  ],
};

const licenciaSSTConfig: CheckoutConfig = {
  productKind: 'licencia_sst',
  title: 'Activar licencia SST',
  subtitle: 'Habilitación profesional en Seguridad y Salud en el Trabajo',
  requiresAuth: true,
  allowGuest: false,
  showShipping: false,
  summaryLabel: 'Resumen de la licencia',
  steps: [
    {
      id: 'datos_profesional',
      title: 'Datos del profesional',
      description: 'Información para la verificación de licencia',
      ctaLabel: 'Continuar al pago',
      schema: buyerPersonaSchema,
      fields: [
        {
          name: 'firstName',
          label: 'Nombre',
          type: 'text',
          placeholder: 'Nombre',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'lastName',
          label: 'Apellido',
          type: 'text',
          placeholder: 'Apellido',
          validation: z.string().min(2).max(80),
          colSpan: 1,
        },
        {
          name: 'documentType',
          label: 'Tipo de documento',
          type: 'select',
          options: DOC_TYPE_OPTIONS,
          validation: documentTypeSchema,
          colSpan: 1,
        },
        {
          name: 'documentNumber',
          label: 'Número de documento',
          type: 'document_number',
          placeholder: 'Número',
          validation: z.string().min(4).max(20),
          colSpan: 1,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'correo@ejemplo.com',
          validation: z.string().email(),
          colSpan: 1,
        },
        {
          name: 'phone',
          label: 'Teléfono',
          type: 'phone',
          placeholder: '+57 300 000 0000',
          mask: 'phone',
          validation: z.string().min(7),
          colSpan: 1,
        },
      ],
    },
  ],
};

// ── Registro de configuraciones ───────────────────────────────────────────────

export const CHECKOUT_CONFIGS: Record<ProductKind, CheckoutConfig> = {
  curso_web: cursoConfig,
  curso_software_app: cursoConfig,
  plan_sst_individual: planIndividualConfig,
  plan_corporativo: planCorporativoConfig,
  pack_maniqui: packManikinConfig,
  licencia_sst: licenciaSSTConfig,
};

export function getCheckoutConfig(kind: ProductKind): CheckoutConfig {
  return CHECKOUT_CONFIGS[kind];
}

// ── Producto resumen (para el panel lateral) ──────────────────────────────────

export interface ProductSummary {
  kind: ProductKind;
  productId: string;
  title: string;
  subtitle?: string;
  icon: string;
  priceCOP: number;
  originalPriceCOP?: number;
  features?: string[];
  imageUrl?: string;
}
