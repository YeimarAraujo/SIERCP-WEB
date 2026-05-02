'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppInstallBanner } from '@/components/notifications/app-install-banner';

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { user, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (initialized && !user) {
            router.replace('/login');
        }
    }, [initialized, user, router]);

    // Mostrar spinner en AMBOS casos: no inicializado O sin usuario
    // Nunca retornar null — siempre mostrar algo mientras redirige
    if (!initialized || !user) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0a0b1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTop: '3px solid #1800AD',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#0E0080' }}>
            {children}
            <AppInstallBanner />
        </div>
    );
}
