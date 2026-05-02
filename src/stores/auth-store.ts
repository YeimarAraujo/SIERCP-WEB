'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserModel } from '@/models/user';
import { ROLE_STUDENT, ROLE_INSTRUCTOR, ROLE_SUPER_ADMIN } from '@/lib/constants';
import { InstitutionService } from '@/services/institution.service';

interface AuthStore {
    user: UserModel | null;
    firebaseUser: User | null;
    loading: boolean;
    initialized: boolean;
    error: string | null;

    initialize: () => () => void;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        identificacion?: string;
        role?: string;
        institutionCode?: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

async function fetchUserModel(uid: string): Promise<UserModel | null> {
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) {
            console.log('User not in Firestore, creating...');
            return {
                uid,
                email: '',
                firstName: 'Usuario',
                lastName: '',
                role: ROLE_STUDENT,
                isActive: true,
                institutionId: uid,
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        const d = snap.data();
        return {
            uid,
            email: d.email ?? '',
            firstName: d.firstName ?? '',
            lastName: d.lastName ?? '',
            role: d.role ?? ROLE_STUDENT,
            avatarUrl: d.avatarUrl,
            identificacion: d.identificacion,
            isActive: d.isActive ?? true,
            institutionId: d.institutionId ?? uid,
            status: d.status ?? 'ACTIVE',
            stats: d.stats,
            createdAt: d.createdAt?.toDate?.() ?? new Date(),
            updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
        };
    } catch (e) {
        console.error('Error fetching user:', e);
        return null;
    }
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            firebaseUser: null,
            loading: false,
            initialized: false,
            error: null,

            initialize: () => {
                const state = get();
                if (state.firebaseUser && state.user && state.initialized) {
                    return () => {};
                }

                if (!state.firebaseUser) {
                    set({ loading: true });
                }

                const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        try {
                            const user = await fetchUserModel(firebaseUser.uid);
                            set({ user, firebaseUser, loading: false, initialized: true, error: null });
                        } catch {
                            set({ user: null, firebaseUser, loading: false, initialized: true });
                        }
                    } else {
                        set({ user: null, firebaseUser: null, loading: false, initialized: true });
                    }
                });
                return unsub;
            },

            login: async (email, password) => {
                set({ loading: true, error: null });
                try {
                    console.log('Login attempt:', email);
                    const cred = await signInWithEmailAndPassword(auth, email, password);
                    console.log('Login success:', cred.user.uid);
                    const user = await fetchUserModel(cred.user.uid);
                    set({ user, firebaseUser: cred.user, loading: false });
                } catch (err: unknown) {
                    console.error('Login error:', err);
                    let msg = 'Error al iniciar sesión';
                    if (err && typeof err === 'object' && 'code' in err) {
                        const code = String((err as { code?: unknown }).code);
                        if (code.includes('auth/wrong-password')) msg = 'Contraseña incorrecta';
                        else if (code.includes('auth/user-not-found')) msg = 'Usuario no encontrado';
                        else if (code.includes('auth/invalid-email')) msg = 'Email inválido';
                        else if (code.includes('auth/invalid-credential')) msg = 'Credenciales inválidas';
                        else msg = code;
                    } else if (err instanceof Error) {
                        msg = err.message;
                    }
                    set({ loading: false, error: msg });
                    throw err;
                }
            },

            register: async ({ email, password, firstName, lastName, identificacion, role, institutionCode }) => {
                set({ loading: true, error: null });
                try {
                    const roleValue = (role as UserModel['role']) ?? ROLE_STUDENT;
                    
                    if (roleValue === ROLE_SUPER_ADMIN || roleValue === 'ADMIN') {
                        throw new Error('Rol no permitido en registro público');
                    }

                    let finalInstitutionId = '';
                    let finalStatus: 'PENDING' | 'ACTIVE' = 'ACTIVE';

                    if (institutionCode) {
                        const exists = await InstitutionService.exists(institutionCode);
                        if (!exists) throw new Error('Código de institución inválido');
                        finalInstitutionId = institutionCode;
                        if (roleValue === ROLE_INSTRUCTOR) finalStatus = 'PENDING';
                    } else {
                        finalStatus = roleValue === ROLE_INSTRUCTOR ? 'PENDING' : 'ACTIVE';
                    }

                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    
                    if (!finalInstitutionId) finalInstitutionId = cred.user.uid;

                    const userModel: Omit<UserModel, 'createdAt' | 'updatedAt'> = {
                        uid: cred.user.uid,
                        email,
                        firstName,
                        lastName,
                        role: roleValue,
                        identificacion,
                        isActive: true,
                        institutionId: finalInstitutionId,
                        status: finalStatus,
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
                    };
                    await setDoc(doc(db, 'users', cred.user.uid), {
                        ...userModel,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                    const user = await fetchUserModel(cred.user.uid);
                    set({ user, firebaseUser: cred.user, loading: false });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Error al registrar';
                    set({ loading: false, error: msg });
                    throw err;
                }
            },

            logout: async () => {
                try {
                    await firebaseSignOut(auth);
                } catch (error) {
                    console.error('Firebase signOut error:', error);
                } finally {
                    set({ user: null, firebaseUser: null, error: null, initialized: true });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'siercp-auth',
            partialize: (state) => ({ user: state.user }),
        },
    ),
);