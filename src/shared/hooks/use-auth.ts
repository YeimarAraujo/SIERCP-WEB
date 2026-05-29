'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth-store';
import type { UserRole } from '@/shared/types/user';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = store.initialize();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const role: UserRole | undefined = store.user?.role;
  // Rol de la membership activa (org-específico). Puede ser diferente al rol global.
  // Un usuario USUARIO globalmente puede ser INSTRUCTOR en una org concreta.
  const membershipRole = store.membershipRole;

  return {
    user: store.user,
    membershipRole,
    loading: store.loading,
    initialized: store.initialized,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    initialize: store.initialize,
    clearError: store.clearError,
    updateLocalUser: store.updateLocalUser,

    // ── Role helpers ──────────────────────────────────────────────────
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    // Instructor por rol global O por membership de la org activa.
    isInstructor: role === 'INSTRUCTOR' || role === 'ADMIN' || role === 'SUPER_ADMIN'
                  || membershipRole === 'INSTRUCTOR',
    isUsuario: role === 'USUARIO' || role === 'USUARIO_PROFESIONAL' || role === 'USUARIO_SST',
    isUsuarioPro: role === 'USUARIO_PROFESIONAL',
    isUsuarioSST: role === 'USUARIO_SST',
    /** @deprecated use isUsuario */
    isStudent: role === 'USUARIO' || role === 'USUARIO_PROFESIONAL' || role === 'USUARIO_SST',

    // ── Business-rule helpers ─────────────────────────────────────────
    canCreateCourses:
      role === 'SUPER_ADMIN' ||
      role === 'ADMIN' ||
      role === 'INSTRUCTOR' ||
      role === 'USUARIO_SST' ||
      role === 'USUARIO_PROFESIONAL' ||
      role === 'USUARIO',

    mustPayToCertify: role === 'USUARIO_PROFESIONAL',

    coursesLeft: (() => {
      if (!store.user) return 0;
      const limits: Record<UserRole, number> = {
        SUPER_ADMIN: Infinity,
        ADMIN: Infinity,
        INSTRUCTOR: Infinity,
        USUARIO_SST: Infinity,
        USUARIO_PROFESIONAL: 10,
        USUARIO: 3,
      };
      const limit = limits[store.user.role] ?? 5;
      return Math.max(0, limit - (store.user.coursesCreated ?? 0));
    })(),
  };
}
