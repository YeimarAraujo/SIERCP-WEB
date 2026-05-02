'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
    const store = useAuthStore();

    useEffect(() => {
        // initialize() retorna la función unsub de onAuthStateChanged
        // El cleanup la ejecuta cuando el componente se desmonta
        const unsubscribe = store.initialize();
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        user: store.user,
        loading: store.loading,
        initialized: store.initialized,
        error: store.error,
        login: store.login,
        register: store.register,
        logout: store.logout,
        clearError: store.clearError,
        isAdmin: store.user?.role === 'ADMIN',
        isInstructor: store.user?.role === 'INSTRUCTOR' || store.user?.role === 'ADMIN',
        isStudent: store.user?.role === 'ESTUDIANTE',
    };
}
