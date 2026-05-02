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
        if (initialized && !user) router.replace('/login');
    }, [initialized, user, router]);

    if (!initialized) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ background: '#0E0080' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2" style={{ borderColor: '#38BDF8', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    <p className="text-sm" style={{ color: '#6B7FCC' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen" style={{ background: '#0E0080' }}>
            {children}
            <AppInstallBanner />
        </div>
    );
}