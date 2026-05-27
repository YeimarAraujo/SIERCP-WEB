'use client';

import { useState } from 'react';
import { SuperAdminSidebar } from '@/components/layout/super-admin-sidebar';
import { SuperAdminTopbar } from '@/components/layout/super-admin-topbar';

export function SuperAdminLayoutClient({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
            <SuperAdminSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((c) => !c)}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
