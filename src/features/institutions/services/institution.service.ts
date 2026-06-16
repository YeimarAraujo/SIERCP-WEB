import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type { Institution as InstitutionType } from '@/shared/types/institution';
import { AuditService } from '@/features/audit/services/audit.service';

export const InstitutionService = {
    exists: async (code: string): Promise<boolean> => {
        if (!db) return false;
        try {
            const snap = await getDoc(doc(db, 'institutions', code));
            return snap.exists();
        } catch (e) {
            console.error('Error checking institution:', e);
            return false;
        }
    },

    create: async (code: string, data: Omit<InstitutionType, 'id'>): Promise<void> => {
        if (!db) throw new Error('Firebase not configured');
        await setDoc(doc(db, 'institutions', code), {
            ...data,
            createdAt: serverTimestamp(),
        });
        await AuditService.record({
            action: 'create',
            resource: 'institution',
            resourceId: code,
            institutionId: code,
            metadata: { name: data.name, plan: data.planType, status: data.status },
        });
    },

    getAll: async (): Promise<InstitutionType[]> => {
        if (!db) return [];
        const snap = await getDocs(collection(db, 'institutions'));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstitutionType));
    },

    update: async (id: string, data: Partial<Omit<InstitutionType, 'id' | 'createdAt'>>): Promise<void> => {
        const res = await fetch(`/api/super-admin/institutions/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { error?: string };
            throw new Error(err.error ?? 'Error al actualizar la institución');
        }
        AuditService.record({
            action: 'update',
            resource: 'institution',
            resourceId: id,
            institutionId: id,
            metadata: data as Record<string, unknown>,
        }).catch(() => undefined);
    },

    remove: async (id: string): Promise<void> => {
        const res = await fetch(`/api/super-admin/institutions/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { error?: string };
            throw new Error(err.error ?? 'Error al eliminar la institución');
        }
        AuditService.record({
            action: 'delete',
            resource: 'institution',
            resourceId: id,
            institutionId: id,
        }).catch(() => undefined);
    },
};
