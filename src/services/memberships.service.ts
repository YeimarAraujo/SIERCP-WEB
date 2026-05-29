import { db } from '@/lib/firebase'; // ajusta a tu config
import {
    collection,
    addDoc,
    doc,
    deleteDoc,
    query,
    where,
    getDocs,
} from 'firebase/firestore';

export type MembershipRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface Membership {
    id?: string;
    userId: string;
    institutionId: string;
    role: MembershipRole;
    createdAt: number;
}

const COLLECTION = 'memberships';

export class MembershipService {
    // ➜ crear relación
    static async create(data: Membership) {
        const ref = await addDoc(collection(db, COLLECTION), {
            ...data,
            createdAt: data.createdAt || Date.now(),
        });

        return { id: ref.id, ...data };
    }

    // ➜ obtener memberships por usuario
    static async getByUser(userId: string) {
        const q = query(
            collection(db, COLLECTION),
            where('userId', '==', userId)
        );

        const snap = await getDocs(q);

        return snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as Membership),
        }));
    }

    // ➜ obtener por institución
    static async getByInstitution(institutionId: string) {
        const q = query(
            collection(db, COLLECTION),
            where('institutionId', '==', institutionId)
        );

        const snap = await getDocs(q);

        return snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as Membership),
        }));
    }

    // ➜ eliminar relación específica
    static async deleteByUserAndInstitution(userId: string, institutionId: string) {
        const q = query(
            collection(db, COLLECTION),
            where('userId', '==', userId),
            where('institutionId', '==', institutionId)
        );

        const snap = await getDocs(q);

        const deletions = snap.docs.map(d =>
            deleteDoc(doc(db, COLLECTION, d.id))
        );

        await Promise.all(deletions);
    }
}