import { Timestamp } from 'firebase/firestore';

export type InstitutionStatus = 'active' | 'suspended' | 'pending';

export type InstitutionPlan = 'basic' | 'pro' | 'enterprise';

export interface Institution {
    id: string;
    name: string;
    code: string;
    nit?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    adminIds: string[];
    plan: InstitutionPlan;
    status: InstitutionStatus;
    maxDevices: number;
    maxInstructors: number;
    maxStudents: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}
