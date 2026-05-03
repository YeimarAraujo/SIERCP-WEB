'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function HomeRedirect() {
    const router = useRouter();

    useEffect(() => {
        const state = useAuthStore.getState();
        if (!state.user) {
            router.replace('/login');
            return;
        }
        switch (state.user.role) {
            case 'ADMIN':
            case 'SUPER_ADMIN':
                router.replace('/admin/dashboard');
                break;
            case 'INSTRUCTOR':
                router.replace('/instructor/dashboard');
                break;
            default:
                router.replace('/student/home');
        }
    }, [router]);

    return (
        <div style={{
            minHeight: '100vh', background: '#F4F5FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                width: 36, height: 36,
                border: '3px solid #E2E4F0',
                borderTop: '3px solid #1800AD',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}
