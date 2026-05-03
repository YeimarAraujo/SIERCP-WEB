'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { AppInstallBanner } from '@/components/notifications/app-install-banner';

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { user, initialized, initialize } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                console.log('[SHELL] bfcache pageshow detectado');
                initialize();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const store = useAuthStore.getState();
                if (!store.initialized) {
                    console.log('[SHELL] visibilitychange: reinicializando auth');
                    initialize();
                }
            }
        };

        const handleUnload = () => {};

        window.addEventListener('pageshow', handlePageShow);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('unload', handleUnload);
        };
    }, [initialize]);

    useEffect(() => {
        if (initialized && !user) {
            router.replace('/login');
        }
    }, [initialized, user, router]);

    if (!user && !initialized) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#F4F5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid rgba(24, 0, 173, 0.1)',
                    borderTop: '3px solid #1800AD',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#F4F5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid rgba(24, 0, 173, 0.1)',
                    borderTop: '3px solid #1800AD',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#F4F5FF' }}>
            {children}
            <AppInstallBanner />
        </div>
    );
}
