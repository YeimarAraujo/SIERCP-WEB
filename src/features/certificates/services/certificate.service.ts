'use client';

import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';

export interface CertificateTemplateField {
    key: string;
    label: string;
    x: number;
    y: number;
    fontSize: number;
    align?: 'left' | 'center' | 'right';
}

export interface CertificateTemplate {
    id: string;
    name: string;
    institutionId?: string;
    logoPath: string;
    page: {
        orientation: 'landscape' | 'portrait';
        format: 'letter' | 'a4';
    };
    fields: CertificateTemplateField[];
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CertificateRecord {
    id: string;
    studentName: string;
    certification: string;
    score: number;
    issuedAt: Date;
    institutionId?: string;
    sessionId?: string;
    templateId?: string;
    status: 'issued' | 'revoked';
    verificationCode: string;
}

function toDate(value: unknown): Date {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    return new Date();
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
    id: 'jomar-standard-v1',
    name: 'JOMAR Standard RCP',
    logoPath: '/assets/JOMAR/logoTexto.png',
    page: { orientation: 'landscape', format: 'letter' },
    isDefault: true,
    fields: [
        { key: 'studentName', label: 'Participante', x: 396, y: 235, fontSize: 28, align: 'center' },
        { key: 'certification', label: 'Certificacion', x: 396, y: 285, fontSize: 16, align: 'center' },
        { key: 'score', label: 'Puntaje', x: 235, y: 360, fontSize: 14, align: 'center' },
        { key: 'issuedAt', label: 'Emision', x: 396, y: 360, fontSize: 14, align: 'center' },
        { key: 'verificationCode', label: 'Folio', x: 558, y: 360, fontSize: 14, align: 'center' },
    ],
};

function parseCertificate(id: string, data: Record<string, unknown>): CertificateRecord {
    return {
        id,
        studentName: String(data.studentName || 'Participante'),
        certification: String(data.certification || 'Entrenamiento RCP'),
        score: Number(data.score || 0),
        issuedAt: toDate(data.issuedAt),
        institutionId: data.institutionId ? String(data.institutionId) : undefined,
        sessionId: data.sessionId ? String(data.sessionId) : undefined,
        templateId: data.templateId ? String(data.templateId) : undefined,
        status: (data.status as CertificateRecord['status']) || 'issued',
        verificationCode: String(data.verificationCode || id),
    };
}

export const CertificateService = {
    async getTemplate(institutionId?: string): Promise<CertificateTemplate> {
        if (!db) return DEFAULT_CERTIFICATE_TEMPLATE;

        try {
            const constraints = institutionId
                ? [where('institutionId', '==', institutionId), where('isDefault', '==', true), limit(1)]
                : [where('isDefault', '==', true), limit(1)];
            const snap = await getDocs(query(collection(db, 'certificateTemplates'), ...constraints));
            if (snap.empty) return DEFAULT_CERTIFICATE_TEMPLATE;
            const item = snap.docs[0];
            const data = item.data();
            return {
                ...DEFAULT_CERTIFICATE_TEMPLATE,
                ...data,
                id: item.id,
                createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
                updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
            } as CertificateTemplate;
        } catch {
            return DEFAULT_CERTIFICATE_TEMPLATE;
        }
    },

    buildVerificationUrl(certificateId: string): string {
        if (typeof window === 'undefined') return `/verify-certificate/${certificateId}`;
        return `${window.location.origin}/verify-certificate/${certificateId}`;
    },

    async issue(input: Omit<CertificateRecord, 'id' | 'verificationCode' | 'status'> & { id?: string }): Promise<string> {
        if (!db) throw new Error('Firebase not configured');
        const ref = input.id ? doc(db, 'certificates', input.id) : doc(collection(db, 'certificates'));
        const verificationCode = ref.id;
        await setDoc(ref, {
            ...input,
            verificationCode,
            status: 'issued',
            issuedAt: input.issuedAt || serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
        return ref.id;
    },

    async getPublic(certificateId: string): Promise<CertificateRecord | null> {
        if (!db) return null;
        const snap = await getDoc(doc(db, 'certificates', certificateId));
        if (!snap.exists()) return null;
        return parseCertificate(snap.id, snap.data() as Record<string, unknown>);
    },
};
