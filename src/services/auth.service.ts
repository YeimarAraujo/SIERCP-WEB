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
    login: async (email: string, password: string): Promise<UserCredential> => {
        if (!_auth) throw new Error('Firebase not configured');
        const userCredential = await signInWithEmailAndPassword(_auth, email, password);
        
        // Obtener el ID Token y enviarlo al backend para crear la cookie HttpOnly
        const idToken = await userCredential.user.getIdToken();
        await fetch('/api/auth/session', {
            method: 'POST',
            body: JSON.stringify({ idToken }),
            headers: { 'Content-Type': 'application/json' },
        });

        return userCredential;
    },

    register: (email: string, password: string): Promise<UserCredential> => {
        if (!_auth) throw new Error('Firebase not configured');
        return createUserWithEmailAndPassword(_auth, email, password);
    },

    logout: async (): Promise<void> => {
        // Cerrar sesión en Firebase
        if (_auth) await signOut(_auth);
        
        // Eliminar la cookie en el servidor
        await fetch('/api/auth/session', { method: 'DELETE' });
    },

    resetPassword: (email: string): Promise<void> => {
        if (!_auth) throw new Error('Firebase not configured');
        return sendPasswordResetEmail(_auth, email);
    },

    // Obtener perfil desde la cookie HttpOnly (Servidor)
    getSessionUser: async () => {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return null;
        return res.json();
    },

    getCurrentUser: () => _auth?.currentUser ?? null,
};