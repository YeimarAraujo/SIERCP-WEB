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

/**
 * Institution operation mode:
 * - AUTOMATED: Courses are pre-configured with auto-cycling cohorts (e.g. Jomar Seguridad)
 * - MANUAL: Institution admins create and manage courses/cohorts manually
 */
export type InstitutionMode = 'AUTOMATED' | 'MANUAL';
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
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdBy: string;
    config?: Record<string, unknown>;
}