'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { StudentSidebar } from '@/components/layout/student-sidebar';

export function StudentShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const state = useAuthStore.getState();

            if (state.user) {
                if (state.user.role !== 'ESTUDIANTE') {
                    if (state.user.role === 'ADMIN' || state.user.role === 'SUPER_ADMIN') {
                        router.replace('/admin/dashboard');
                    } else if (state.user.role === 'INSTRUCTOR') {
                        router.replace('/instructor/dashboard');
                    }
                    return;
                }
                setReady(true);
                return;
            }

            if (state.initialized && !state.user) {
                router.replace('/login');
                return;
            }
        };

        checkAuth();

        const unsub = useAuthStore.subscribe(checkAuth);

        const handlePageShow = (e: PageTransitionEvent) => {
            if (e.persisted) checkAuth();
        };
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            unsub();
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [router]);

    if (!ready) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg-page)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid var(--border)',
                    borderTop: '3px solid var(--brand)',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--bg-page)',
            color: 'var(--text-primary)',
        }}>
            <StudentSidebar />
            <main style={{
                flex: 1,
                overflowY: 'auto',
                background: 'var(--bg-page)',
                padding: '32px',
            }}>
                {children}
            </main>
        </div>
    );
}
