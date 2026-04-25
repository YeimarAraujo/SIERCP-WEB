import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    type UserCredential,
    type Auth,
} from 'firebase/auth';
import { auth as _auth } from '@/lib/firebase';

export const AuthService = {
    login: (email: string, password: string): Promise<UserCredential> => {
        if (!_auth) throw new Error('Firebase not configured');
        return signInWithEmailAndPassword(_auth, email, password);
    },

    register: (email: string, password: string): Promise<UserCredential> => {
        if (!_auth) throw new Error('Firebase not configured');
        return createUserWithEmailAndPassword(_auth, email, password);
    },

    logout: (): Promise<void> => {
        if (!_auth) return Promise.resolve();
        return signOut(_auth);
    },

    resetPassword: (email: string): Promise<void> => {
        if (!_auth) throw new Error('Firebase not configured');
        return sendPasswordResetEmail(_auth, email);
    },

    getCurrentUser: () => _auth?.currentUser ?? null,
};