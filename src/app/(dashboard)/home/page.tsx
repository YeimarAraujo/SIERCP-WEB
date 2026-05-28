'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function HomeRedirect() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const initialized = useAuthStore((s) => s.initialized);

    useEffect(() => {
        if (!initialized) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        switch (user.role) {
            case 'ADMIN':
                router.replace('/admin/dashboard');
                break;
            case 'SUPER_ADMIN':
                router.replace('/super-admin/dashboard');
                break;
            case 'INSTRUCTOR':
                router.replace('/instructor/dashboard');
                break;
            default:
                router.replace('/student/home');
        }
    }, [router, user, initialized]);

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--background)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                width: 36, height: 36,
                border: '3px solid var(--border)',
                borderTop: '3px solid var(--brand)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}
