import { Timestamp } from 'firebase/firestore';

export type InstitutionStatus = 'active' | 'suspended' | 'pending';

export type InstitutionPlan =
    | 'pyme'
    | 'business'
    | 'corporate'
    | 'enterprise'
    | 'sstSinLicencia'
    | 'sstConLicencia'
    | string;

/**
 * Institution operation mode:
 * - AUTOMATED: Courses are pre-configured with auto-cycling cohorts (e.g. Jomar Seguridad)
 * - MANUAL: Institution admins create and manage courses/cohorts manually
 */
export type InstitutionMode = 'AUTOMATED' | 'MANUAL';

export interface Institution {
    id: string;
    name: string;
    code: string;
    mode: InstitutionMode;
    nit?: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    contactEmail?: string;
    contactPhone?: string;
    logoUrl?: string;
    adminIds: string[];
    plan: InstitutionPlan;
    status: InstitutionStatus;
    maxDevices: number;
    maxInstructors: number;
    maxStudents: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdBy: string;
}