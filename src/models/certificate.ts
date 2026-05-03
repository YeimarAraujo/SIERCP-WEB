import { Timestamp } from 'firebase/firestore';

export type CertificateStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Certificate {
    id: string;
    studentId: string;
    studentName: string;
    instructorId: string;
    instructorName: string;
    adminId?: string;
    courseId: string;
    courseName: string;
    institutionId: string;
    institutionName: string;
    sessionIds: string[];
    averageScore: number;
    minScoreRequired: number;
    status: CertificateStatus;
    issuedAt?: Timestamp;
    expiresAt?: Timestamp;
    pdfUrl?: string;
    createdAt: Timestamp;
    approvedBy?: string;
    notes?: string;
}
