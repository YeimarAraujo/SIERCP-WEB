'use client';

import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';

export default function AdminDashboardPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Panel de control" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader
                    title="Panel de control"
                    subtitle="Dashboard de administración"
                />

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}>
                    <StatCard label="Sesiones activas" value="—" />
                    <StatCard label="Dispositivos online" value="—/—" />
                    <StatCard label="Score promedio" value="—%" />
                    <StatCard label="Alertas activas" value="—" color="#EF4444" />
                </div>

                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    padding: 32,
                    textAlign: 'center',
                }}>
                    <p style={{ color: '#8892A4', fontSize: 14 }}>
                        Dashboard en construcción
                    </p>
                </div>
            </div>
        </div>
    );
}
