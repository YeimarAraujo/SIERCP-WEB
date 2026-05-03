'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Header } from '@/components/layout/header';

export function AdminShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const state = useAuthStore.getState();

            if (state.user) {
                if (state.user.role !== 'ADMIN' && state.user.role !== 'SUPER_ADMIN') {
                    if (state.user.role === 'INSTRUCTOR') {
                        router.replace('/instructor/dashboard');
                    } else {
                        router.replace('/student/home');
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
            <AdminSidebar />
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
            }}>
                <Header role="ADMIN" />
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '32px',
                    background: 'var(--bg-page)',
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
