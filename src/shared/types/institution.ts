import { Timestamp } from 'firebase/firestore';

export type InstitutionStatus = 'active' | 'suspended' | 'pending' | 'rejected';

export type InstitutionPlan =
    | 'pyme'
    | 'business'
    | 'corporate'
    | 'enterprise'
    | 'sstSinLicencia'
    | 'sstConLicencia'
    | string;

export type InstitutionMode = 'AUTOMATED' | 'MANUAL';

/**
 * Nivel del tenant en el modelo de 3 niveles (JOMAR Group › SIERCP SaaS › Instituciones):
 *   OWNER   — institución operada por la empresa dueña del SaaS (JOMAR Academy).
 *   PARTNER — institución aliada estratégica (puede destacarse en "Aliadas").
 *   CLIENT  — institución cliente estándar (default).
 * Solo SUPER_ADMIN puede asignar/cambiar el tier (enforced en firestore.rules).
 */
export type InstitutionTier = 'OWNER' | 'PARTNER' | 'CLIENT';

export type CreateInstitutionInput =
    Omit<Institution, 'id'>;
export interface Institution {
    id: string;
    name: string;
    code: string;
    nit?: string;
    mode: InstitutionMode;
    type?: string;
    address: string;
    city?: string;
    department?: string;
    country?: string;
    contactEmail?: string;
    contactPhone?: string;
    logoUrl?: string;
    adminIds: string[];
    primaryAdminId?: string;
    memberCount: number;
    activeCoursesCount: number;
    totalSessionsCount: number;
    planType: InstitutionPlan;
    status: InstitutionStatus;
    planActivatedAt?: Timestamp;
    planExpiresAt?: Timestamp;
    maxDevices: number;
    maxInstructors: number;
    maxStudents: number;
    // ── Modelo de 3 niveles ──────────────────────────────────────────────────
    /** Nivel del tenant. Default 'CLIENT'. Solo SUPER_ADMIN lo cambia. */
    tier: InstitutionTier;
    /** Si aparece en la sección pública "Instituciones Aliadas". Default false. */
    showcase: boolean;
    /** UID responsable de facturación (Nivel 1 para OWNER). */
    billingOwnerUid?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdBy: string;
    config?: Record<string, unknown>;
}