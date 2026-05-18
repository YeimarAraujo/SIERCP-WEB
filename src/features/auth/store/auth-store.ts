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
import { auth, db } from '@/shared/lib/firebase';
import type { UserModel } from '@/shared/types/user';
import { ROLE_STUDENT, ROLE_INSTRUCTOR, ROLE_SUPER_ADMIN } from '@/shared/lib/constants';
import { InstitutionService } from '@/features/institutions/services/institution.service';
import { AuditService } from '@/features/audit/services/audit.service';

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
    updateLocalUser: (userData: Partial<UserModel>) => void;
}

async function fetchUserModel(uid: string): Promise<UserModel | null> {
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) {
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

// Flag de módulo para evitar múltiples listeners
let _unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            firebaseUser: null,
            loading: false,
            initialized: false,
            error: null,

            initialize: () => {
                if (_unsubscribe) return _unsubscribe;
                const alreadyHasUser = !!get().user;
                set({ loading: !alreadyHasUser });
                _unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
            if (firebaseUser) {
                const user = await fetchUserModel(firebaseUser.uid);
                set({ user, firebaseUser, loading: false, initialized: true, error: null });
            } else {
                set({ user: null, firebaseUser: null, loading: false, initialized: true });
            }
        } catch (error) {
            set({ initialized: true, loading: false, error: String(error) });
        }
    });

    return _unsubscribe;
},

            login: async (email, password) => {
               set({ loading: true, error: null });
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);

        const idToken = await cred.user.getIdToken();
        const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        if (!res.ok) throw new Error('Error al crear sesión en servidor');

        const user = await fetchUserModel(cred.user.uid);
        set({ user, firebaseUser: cred.user, loading: false, initialized: true });
        if (user) {
            AuditService.record({
                actor: {
                    uid: user.uid,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    role: user.role,
                },
                action: 'auth.login',
                resource: 'auth',
                resourceId: user.uid,
                institutionId: user.institutionId,
                metadata: { provider: 'firebase-auth' },
            });
        }
    } catch (err: unknown) {
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
                    throw new Error(msg);
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
                    set({ user, firebaseUser: cred.user, loading: false, initialized: true });
                    AuditService.record({
                        actor: {
                            uid: cred.user.uid,
                            email,
                            name: `${firstName} ${lastName}`.trim(),
                            role: roleValue,
                        },
                        action: 'create',
                        resource: 'user',
                        resourceId: cred.user.uid,
                        institutionId: finalInstitutionId,
                        metadata: { source: 'public-register', role: roleValue, status: finalStatus },
                    });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Error al registrar';
                    set({ loading: false, error: msg });
                    throw err;
                }
            },

            logout: async () => {
    const currentUser = get().user;
    if (currentUser) {
        AuditService.record({
            actor: {
                uid: currentUser.uid,
                email: currentUser.email,
                name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
                role: currentUser.role,
            },
            action: 'auth.logout',
            resource: 'auth',
            resourceId: currentUser.uid,
            institutionId: currentUser.institutionId,
        });
    }
    await fetch('/api/auth/session', { method: 'DELETE' });
    
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Firebase signOut error:', error);
    } finally {
        set({ user: null, firebaseUser: null, error: null, initialized: true, loading: false });
    }
},

            clearError: () => set({ error: null }),

            updateLocalUser: (userData) => set((state) => ({
                user: state.user ? { ...state.user, ...userData } : null,
            })),
        }),
        {
            name: 'siercp-auth',
            partialize: (state) => ({
                user: state.user,
                initialized: state.initialized,
            }),
        },
    ),
);
