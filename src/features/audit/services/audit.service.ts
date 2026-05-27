'use client';

import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
    Timestamp,
    where,
    type DocumentSnapshot,
    type QueryConstraint,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/shared/lib/firebase';
import type { UserModel } from '@/shared/types/user';

/**
 * Obtiene el Firebase ID Token del usuario actualmente autenticado.
 * Retorna null si no hay sesión activa o si ocurre algún error.
 * Utilizado para autenticar llamadas al endpoint /api/audit.
 */
async function getFirebaseIdToken(): Promise<string | null> {
    try {
        const auth = getAuth();
        if (!auth.currentUser) return null;
        return await auth.currentUser.getIdToken();
    } catch {
        return null;
    }
}

export type AuditAction =
    | 'auth.login'
    | 'auth.logout'
    | 'create'
    | 'update'
    | 'delete'
    | 'export.csv'
    | 'export.pdf'
    | 'certificate.generate'
    | 'certificate.verify'
    | 'role.change'
    | 'system.error';

export interface AuditActor {
    uid?: string;
    email?: string;
    name?: string;
    role?: UserModel['role'];
}

export interface AuditLog {
    id: string;
    actor: AuditActor;
    action: AuditAction | string;
    resource: string;
    resourceId?: string;
    timestamp: Date;
    institutionId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    severity?: 'info' | 'warning' | 'critical';
}

export interface AuditLogInput {
    actor?: AuditActor;
    action: AuditAction | string;
    resource: string;
    resourceId?: string;
    institutionId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    severity?: 'info' | 'warning' | 'critical';
}

export interface AuditLogFilters {
    action?: string;
    institutionId?: string;
    resource?: string;
    search?: string;
    limit?: number;
    after?: DocumentSnapshot;
}

function toDate(value: unknown): Date {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    return new Date();
}

function parseAuditLog(id: string, data: Record<string, unknown>): AuditLog {
    return {
        id,
        actor: (data.actor || {}) as AuditActor,
        action: String(data.action || 'unknown'),
        resource: String(data.resource || 'system'),
        resourceId: data.resourceId ? String(data.resourceId) : undefined,
        timestamp: toDate(data.timestamp),
        institutionId: data.institutionId ? String(data.institutionId) : undefined,
        metadata: (data.metadata || {}) as Record<string, unknown>,
        ip: data.ip ? String(data.ip) : undefined,
        severity: (data.severity as AuditLog['severity']) || 'info',
    };
}

export function getPersistedAuditActor(): { actor?: AuditActor; institutionId?: string } {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.localStorage.getItem('siercp-auth');
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const user = parsed?.state?.user as UserModel | undefined;
        if (!user) return {};

        return {
            actor: {
                uid: user.uid,
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                role: user.role,
            },
            institutionId: user.institutionId,
        };
    } catch {
        return {};
    }
}
const removeUndefined = (obj: any) =>
    Object.fromEntries(
        Object.entries(obj || {}).filter(([_, v]) => v !== undefined)
    );

export const AuditService = {
    async record(input: AuditLogInput): Promise<void> {
        if (!db) return;

        const persisted = getPersistedAuditActor();
        const actor = input.actor || persisted.actor || {};
        const payload = {
            actor,
            action: input.action,
            resource: input.resource,
            resourceId: input.resourceId || null,
            institutionId: input.institutionId || persisted.institutionId || null,
            metadata: removeUndefined(input.metadata),
            severity: input.severity || 'info',
        };

        /**
         * Vía preferente: endpoint API /api/audit.
         * Utiliza Admin SDK server-side (bypass de reglas de Firestore).
         * Más seguro que escritura directa desde cliente.
         */
        try {
            const idToken = await getFirebaseIdToken();
            if (idToken) {
                const res = await fetch('/api/audit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify(payload),
                });
                if (res.ok) return;
                // Fallback a Firestore directo si el API responde con error 4xx/5xx
                console.warn('[audit] API falló, intentando Firestore directo:', res.status);
            }
        } catch (apiError) {
            // Error de red o excepción; fallback a Firestore directo
            console.warn('[audit] API error, fallback a Firestore:', apiError);
        }

        /**
         * Fallback: escritura directa vía Firestore SDK.
         * Requiere que las reglas de seguridad permitan create en auditLogs
         * (actualizadas para permitir create con validación anti-spoofing).
         */
        try {
            const ref = doc(collection(db, 'auditLogs'));
            await setDoc(ref, {
                ...payload,
                ip: input.ip || null,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.warn('[audit] log skipped:', error);
        }
    },

    async list(filters: AuditLogFilters = {}): Promise<{ logs: AuditLog[]; cursor?: DocumentSnapshot }> {
        if (!db) return { logs: [] };

        const constraints: QueryConstraint[] = [];
        if (filters.action) constraints.push(where('action', '==', filters.action));
        if (filters.institutionId) constraints.push(where('institutionId', '==', filters.institutionId));
        if (filters.resource) constraints.push(where('resource', '==', filters.resource));
        constraints.push(orderBy('timestamp', 'desc'));
        if (filters.after) constraints.push(startAfter(filters.after));
        constraints.push(limit(filters.limit || 50));

        const snap = await getDocs(query(collection(db, 'auditLogs'), ...constraints));
        let logs = snap.docs.map((item) => parseAuditLog(item.id, item.data() as Record<string, unknown>));

        if (filters.search?.trim()) {
            const term = filters.search.trim().toLowerCase();
            logs = logs.filter((log) => {
                const haystack = [
                    log.actor.name,
                    log.actor.email,
                    log.action,
                    log.resource,
                    log.resourceId,
                    log.institutionId,
                    JSON.stringify(log.metadata || {}),
                ].join(' ').toLowerCase();
                return haystack.includes(term);
            });
        }

        return { logs, cursor: snap.docs.at(-1) };
    },
};
