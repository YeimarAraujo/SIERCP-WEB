'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/layout/role-guard';
import { ROLE_SUPER_ADMIN } from '@/lib/constants';
import { SuperAdminSidebar } from '@/components/layout/super-admin-sidebar';
import { ToastProvider } from '@/components/layout/toast-provider';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <RoleGuard allowedRoles={[ROLE_SUPER_ADMIN]}>
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
                <SuperAdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {children}
                </main>
            </div>
            <ToastProvider />
        </RoleGuard>
    );
}
