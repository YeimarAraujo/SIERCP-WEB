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

            if (state?.user) {
                const role = state.user.role;
                if (role !== 'ESTUDIANTE') {
                    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                        router.replace('/admin/dashboard');
                    } else if (role === 'INSTRUCTOR') {
                        router.replace('/instructor/dashboard');
                    }
                    return;
                }
                setReady(true);
                return;
            }

            if (state?.initialized && !state?.user) {
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
            <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
                <div className="w-9 h-9 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-page)] text-slate-800">
            <StudentSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
