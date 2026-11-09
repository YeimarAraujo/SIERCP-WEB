/** Cliente de /api/privacy (autorización de datos y derechos del titular). */
import { getAuth } from 'firebase/auth';
import { PRIVACY_POLICY_VERSION, type Guardian, type PrivacyRequestType } from '@/lib/privacy';

export class PrivacyError extends Error {
    constructor(message: string, readonly needsGuardian = false) {
        super(message);
    }
}

async function token(): Promise<string> {
    const value = await getAuth().currentUser?.getIdToken();
    if (!value) throw new PrivacyError('No autenticado');
    return value;
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
    const res = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new PrivacyError(data.error ?? `Error ${res.status}`, data.needsGuardian === true);
    return data as T;
}

export const PrivacyClient = {
    recordConsent(input: { birthDate: string; marketing: boolean; guardian?: Guardian }) {
        return post<{ ok: true }>({ action: 'consent', policyVersion: PRIVACY_POLICY_VERSION, channel: 'web', ...input });
    },

    setMarketing(enabled: boolean) {
        return post<{ ok: true }>({ action: 'marketing', enabled, channel: 'web' });
    },

    async request(type: PrivacyRequestType, message: string): Promise<Date> {
        const data = await post<{ dueAt: string }>({ action: 'request', type, message });
        return new Date(data.dueAt);
    },

    /** Descarga el archivo con todos los datos del usuario. */
    async download(): Promise<void> {
        const res = await fetch('/api/privacy', { headers: { Authorization: `Bearer ${await token()}` } });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new PrivacyError(data.error ?? `Error ${res.status}`);
        }
        const url = URL.createObjectURL(await res.blob());
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mis-datos-sicap.json';
        link.click();
        URL.revokeObjectURL(url);
    },
};
