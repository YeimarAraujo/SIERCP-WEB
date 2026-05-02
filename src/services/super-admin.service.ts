import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserModel } from '@/models/user';
import { ROLE_ADMIN, ROLE_INSTRUCTOR } from '@/lib/constants';
import { InstitutionService } from './institution.service';

export const SuperAdminService = {
    createInstitution: async (code: string, name: string): Promise<void> => {
        if (!db) throw new Error('Firebase not configured');
        await InstitutionService.create(code, { name });
    },

    assignInstitutionalAdmin: async (email: string, password: string, institutionCode: string, firstName: string, lastName: string): Promise<UserCredential> => {
        if (!auth || !db) throw new Error('Firebase not configured');
        
        const exists = await InstitutionService.exists(institutionCode);
        if (!exists) throw new Error('Institución no existe');

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            email,
            firstName,
            lastName,
            role: ROLE_ADMIN,
            isActive: true,
            institutionId: institutionCode,
            status: 'ACTIVE',
            stats: {
                totalSessions: 0,
                sessionsToday: 0,
                averageScore: 0,
                bestScore: 0,
                streakDays: 0,
                totalHours: 0,
                averageDepthMm: 0,
                averageRatePerMin: 0,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return cred;
    },

    getPendingInstructors: async (): Promise<UserModel[]> => {
        if (!db) return [];
        const snap = await getDocs(collection(db, 'users'));
        const users = snap.docs.map(doc => doc.data() as UserModel);
        return users.filter(u => u.role === ROLE_INSTRUCTOR && u.status === 'PENDING');
    },

    approveInstructor: async (uid: string): Promise<void> => {
        if (!db) throw new Error('Firebase not configured');
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) throw new Error('Usuario no existe');
        
        await updateDoc(userRef, {
            status: 'ACTIVE',
            updatedAt: serverTimestamp(),
        });

        const userData = snap.data();
        if (userData.email) {
            try {
                await sendPasswordResetEmail(auth, userData.email);
            } catch (e) {
                console.log('Error sending notification email:', e);
            }
        }
    },
};
