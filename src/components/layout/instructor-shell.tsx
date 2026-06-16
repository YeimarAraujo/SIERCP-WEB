'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { InstructorSidebar } from '@/components/layout/instructor-sidebar';
import { ToastProvider } from '@/components/layout/toast-provider';

/**
 * Verifica si el usuario tiene al menos una membership activa con rol INSTRUCTOR.
 * Usa memberships (no courses) porque el usuario siempre puede leer sus propias memberships.
 * Esto evita el 403 que ocurre al consultar courses con role=USUARIO.
 */
async function hasInstructorMembership(uid: string): Promise<boolean> {
    try {
        const q = query(
            collection(db, 'memberships'),
            where('userId', '==', uid),
            where('role', '==', 'INSTRUCTOR'),
            where('isActive', '==', true),
            limit(1),
        );
        const snap = await getDocs(q);
        return !snap.empty;
    } catch {
        return false;
    }
}

export function InstructorShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const checkAuth = async () => {
            const state = useAuthStore.getState();
            if (!state.initialized) return;

            if (!state.user) {
                if (!cancelled) router.replace('/login');
                return;
            }

            const role           = state.user.role ?? '';
            const membershipRole = state.membershipRole ?? '';

            // Acceso inmediato por rol global o membership activo
            const hasDirectAccess =
                role === 'INSTRUCTOR'           ||
                role === 'ADMIN'                ||
                role === 'SUPER_ADMIN'          ||
                membershipRole === 'INSTRUCTOR' ||
                membershipRole === 'ADMIN';

            if (hasDirectAccess) {
                if (!cancelled) setReady(true);
                return;
            }

            // Acceso condicional: instructor por membership en otra org
            const isInstructor = await hasInstructorMembership(state.user.uid);
            if (cancelled) return;

            if (isInstructor) {
                setReady(true);
                return;
            }

            // Sin acceso de instructor: a este punto solo llegan usuarios/estudiantes
            // (admins y super-admins ya obtuvieron acceso directo arriba).
            router.replace('/student/home');
        };

        checkAuth();

        const unsub = useAuthStore.subscribe(() => { checkAuth(); });

        const handlePageShow = (e: PageTransitionEvent) => {
            if (e.persisted) checkAuth();
        };
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            cancelled = true;
            unsub();
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [router]);

    if (!ready) {
        return (
            <div style={{
                minHeight: '100vh', background: 'var(--bg-page)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid var(--border)', borderTop: '3px solid var(--brand)',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
            </div>
        );
    }

    return (
        <div className="app-shell-root" style={{
            display: 'flex', height: '100dvh', minHeight: '100dvh',
            background: 'var(--bg-page)', color: 'var(--text-primary)', overflow: 'hidden',
        }}>
            <InstructorSidebar collapsed />
            <main className="app-main" style={{
                flex: 1, overflowY: 'auto', background: 'var(--bg-page)',
                padding: '32px', minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            }}>
                {children}
            </main>
            <ToastProvider />
        </div>
    );
}
