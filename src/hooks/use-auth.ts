'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
    const store = useAuthStore();

    useEffect(() => {
        if (!store.initialized) {
            const unsub = store.initialize();
            return unsub;
        }
    }, [store.initialized]); // eslint-disable-line react-hooks/exhaustive-deps

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