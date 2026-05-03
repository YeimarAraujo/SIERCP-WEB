'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { InstructorSidebar } from '@/components/layout/instructor-sidebar';

export function InstructorShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const state = useAuthStore.getState();

            if (state.user) {
                if (state.user.role !== 'INSTRUCTOR') {
                    if (state.user.role === 'ADMIN' || state.user.role === 'SUPER_ADMIN') {
                        router.replace('/admin/dashboard');
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
                background: '#F4F5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid #E2E4F0',
                    borderTop: '3px solid #1800AD',
                    borderRadius: '50%',
                    animation: 'spinner 0.7s linear infinite',
                }} />
                <style>{`@keyframes spinner{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F5FF' }}>
            <InstructorSidebar />
            <main style={{ flex: 1, overflow: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
