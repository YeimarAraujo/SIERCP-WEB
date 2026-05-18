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
            metadata: { name: data.name, plan: data.plan, status: data.status },
        });
    },

    getAll: async (): Promise<InstitutionType[]> => {
        if (!db) return [];
        const snap = await getDocs(collection(db, 'institutions'));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstitutionType));
    },
};
