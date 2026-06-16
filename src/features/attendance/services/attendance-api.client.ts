'use client';

/**
 * Cliente de la API de asistencia (servidor autoritativo).
 * Backend: src/app/api/attendance/route.ts
 */

import { getAuth } from 'firebase/auth';
import type { AttendanceStatus, AttendanceMode } from '@/shared/types/attendance';

async function authHeaders(): Promise<HeadersInit> {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error('No autenticado');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export interface BulkEntry {
    studentId: string;
    studentName?: string;
    status: AttendanceStatus;
    justification?: string;
}

export const AttendanceApi = {
    /** Marca asistencia de un grupo en una clase. Devuelve tasas recalculadas. */
    async markBulk(opts: {
        courseId: string;
        classId: string;
        classLabel?: string;
        mode?: AttendanceMode;
        date?: string;
        entries: BulkEntry[];
    }): Promise<{ updated: number; rates: Record<string, number> }> {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: await authHeaders(),
            body: JSON.stringify({ action: 'bulk', ...opts }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
        return data;
    },
};
