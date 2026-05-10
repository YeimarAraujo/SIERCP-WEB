'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth-store';

export function useAuth() {
    const store = useAuthStore();

    useEffect(() => {
        const unsubscribe = store.initialize();
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);

    return {
        user: store.user,
        loading: store.loading,
        initialized: store.initialized,
        error: store.error,
        login: store.login,
        register: store.register,
        logout: store.logout,
        initialize: store.initialize,
        clearError: store.clearError,
        updateLocalUser: store.updateLocalUser,
        isAdmin: store.user?.role === 'ADMIN',
        isInstructor: store.user?.role === 'INSTRUCTOR' || store.user?.role === 'ADMIN',
        isStudent: store.user?.role === 'ESTUDIANTE',
    };
}