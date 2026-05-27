'use client';

import { useEffect, useState } from 'react';

interface MinimalUser {
    email?: string;
    firstName?: string;
    role?: string;
    uid?: string;
}

interface MinimalAuthState {
    user: MinimalUser | null;
    loading: boolean;
    initialized: boolean;
    logout: () => void;
}

/**
 * Versión ligera de useAuth() que NO inicializa Firebase listeners.
 * Solo lee el usuario persistido en localStorage vía Zustand persist.
 *
 * Usado en la landing page (Navbar) para decidir entre mostrar
 * "Mi Portal" o el menú de usuario sin disparar onAuthStateChanged,
 * onSnapshot, ni cargar el SDK de Firestore.
 */
export function useAuthMinimal(): MinimalAuthState {
    const [state, setState] = useState<MinimalAuthState>({
        user: null,
        loading: true,
        initialized: false,
        logout: () => {},
    });

    const doLogout = () => {
        // Limpiar localStorage y redirigir — el Navbar hace router.push o similar
        try { localStorage.removeItem('siercp-auth'); } catch {}
        window.location.href = '/login';
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem('siercp-auth');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.state?.user) {
                    setState({
                        user: {
                            email: parsed.state.user.email,
                            firstName: parsed.state.user.firstName,
                            role: parsed.state.user.role,
                            uid: parsed.state.user.uid,
                        },
                        loading: false,
                        initialized: true,
                        logout: doLogout,
                    });
                    return;
                }
            }
        } catch {
            // ignore parse errors
        }
        setState({ user: null, loading: false, initialized: true, logout: doLogout });
    }, []);

    return state;
}
