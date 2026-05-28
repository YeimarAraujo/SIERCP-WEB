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
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, getSecondaryAuth } from '@/shared/lib/firebase';
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
        phoneNumber?: string;
        role?: string;
        institutionCode?: string;
        address?: string;
        city?: string;
        department?: string;
        country?: string;
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
                address: '',
                city: '',
                department: '',
                country: 'Colombia',
                role: ROLE_STUDENT,
                isActive: true,
                institutionId: uid,
                status: 'ACTIVE',
                certVerification: 'NONE',
                coursesCreated: 0,
                memberships: [],
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
            address: d.address ?? '',
            city: d.city ?? '',
            department: d.department ?? '',
            country: d.country ?? 'Colombia',
            role: d.role ?? ROLE_STUDENT,
            avatarUrl: d.avatarUrl,
            identificacion: d.identificacion,
            phoneNumber: d.phoneNumber,
            isActive: d.isActive ?? true,
            institutionId: d.institutionId ?? uid,
            status: d.status ?? 'ACTIVE',
            certVerification: d.certVerification ?? 'NONE',
            coursesCreated: d.coursesCreated ?? 0,
            stats: d.stats,
            memberships: d.memberships ?? [],
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
let _userDocUnsubscribe: (() => void) | null = null;

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
                    // Limpiar listener anterior del documento de usuario
                    if (_userDocUnsubscribe) { _userDocUnsubscribe(); _userDocUnsubscribe = null; }

                    try {
                        if (firebaseUser) {
                            const user = await fetchUserModel(firebaseUser.uid);

                            // Verificar si la cuenta está desactivada al inicializar
                            if (user && user.isActive === false) {
                                // Cuenta desactivada: forzar logout sin mostrar error
                                await get().logout();
                                return;
                            }

                            set({ user, firebaseUser, loading: false, initialized: true, error: null });

                            // Escuchar cambios en tiempo real del documento del usuario
                            // Esto permite detectar desactivación de cuenta sin recargar
                            if (user) {
                                _userDocUnsubscribe = onSnapshot(
                                    doc(db, 'users', firebaseUser.uid),
                                    (snapshot) => {
                                        if (!snapshot.exists()) {
                                            // Documento eliminado: forzar logout
                                            get().logout();
                                            return;
                                        }
                                        const data = snapshot.data() as Partial<UserModel>;
                                        if (data.isActive === false) {
                                            // Cuenta desactivada en tiempo real: forzar logout
                                            console.warn('[auth-store] Cuenta desactivada en tiempo real, forzando logout');
                                            get().logout();
                                            return;
                                        }
                                        // Actualizar datos locales del usuario en tiempo real
                                        set((state) => ({
                                            user: state.user ? { ...state.user, ...data } : null,
                                        }));
                                    },
                                    (error) => {
                                        console.error('[auth-store] Error en snapshot de usuario:', error);
                                    }
                                );
                            }
                        } else {
                            set({ user: null, firebaseUser: null, loading: false, initialized: true });
                        }
                    } catch (error) {
                        set({ initialized: true, loading: false, error: String(error) });
                    }
                });

                return () => {
                    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
                    if (_userDocUnsubscribe) { _userDocUnsubscribe(); _userDocUnsubscribe = null; }
                };
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

                    // Validar que la cuenta esté activa antes de permitir el login
                    if (user && user.isActive === false) {
                        await firebaseSignOut(auth);
                        set({ loading: false, error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
                        throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador.');
                    }

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

            register: async ({ email, password, firstName, lastName, identificacion, phoneNumber, role, institutionCode, address, city, department, country }) => {
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

                    const userModel: Omit<UserModel, 'createdAt' | 'updatedAt' | 'certVerification'> = {
                        uid: cred.user.uid,
                        email,
                        firstName,
                        lastName,
                        role: roleValue,
                        identificacion,
                        ...(phoneNumber ? { phoneNumber } : {}),
                        ...(address ? { address } : {}),
                        ...(city ? { city } : {}),
                        ...(department ? { department } : {}),
                        ...(country ? { country } : {}),
                        isActive: true,
                        institutionId: finalInstitutionId,
                        status: finalStatus,
                        coursesCreated: 0,
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
                if (_userDocUnsubscribe) { _userDocUnsubscribe(); _userDocUnsubscribe = null; }
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
