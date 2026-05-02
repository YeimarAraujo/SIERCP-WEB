import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Institution {
    id: string;
    name: string;
    createdAt?: Date;
}

export const InstitutionService = {
    exists: async (code: string): Promise<boolean> => {
        if (!db) return false;
        const snap = await getDoc(doc(db, 'institutions', code));
        return snap.exists();
    },

    create: async (code: string, data: Omit<Institution, 'id'>): Promise<void> => {
        if (!db) throw new Error('Firebase not configured');
        await setDoc(doc(db, 'institutions', code), {
            ...data,
            createdAt: serverTimestamp(),
        });
    },

    getAll: async (): Promise<Institution[]> => {
        if (!db) return [];
        const snap = await getDocs(collection(db, 'institutions'));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institution));
    },
};
