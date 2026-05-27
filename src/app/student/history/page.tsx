'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import { Clock, Activity, BarChart, ChevronRight, History, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { useRouter } from 'next/navigation';

export default function StudentHistoryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        SessionService.getByStudent(user.uid, 500)
            .then(setSessions)
            .finally(() => setLoading(false));
    }, [user]);

    const filtered = sessions.filter(s =>
        searchTerm === '' ||
        s.scenarioTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            key: 'startedAt',
            label: 'Fecha y Hora',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(val)}</div>
                </div>
            )
        },
        {
            key: 'scenarioTitle',
            label: 'Escenario',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Activity size={14} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ color: 'var(--foreground)', fontWeight: 800 }}>{val || 'Sesión RCP'}</div>
                </div>
            )
        },
        {
            key: 'qualityScore',
            label: 'Calidad',
            render: (_: any, row: any) => {
                const score = row.metrics?.qualityScore || 0;
                return (
                    <div style={{
                        fontSize: 16, fontWeight: 900,
                        color: score >= 85 ? '#10B981' : '#EF4444'
                    }}>
                        {Math.round(score)}%
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Resultado',
            render: (_: any, row: any) => {
                const score = row.metrics?.qualityScore || 0;
                const approved = score >= 85;
                return (
                    <span style={{
                        fontSize: 10, fontWeight: 900, padding: '6px 12px', borderRadius: 20,
                        background: approved ? '#DCFCE7' : '#FEE2E2',
                        color: approved ? '#166534' : '#991B1B',
                        letterSpacing: '0.05em'
                    }}>
                        {approved ? 'CERTIFICABLE' : 'PRÁCTICA'}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: '',
            render: () => <ChevronRight size={18} style={{ color: 'var(--border-strong)' }} />
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Mi Historial" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Historial de Sesiones"
                    subtitle="Registro detallado de tu evolución en maniobras RCP"
                    parentTitle="Inicio"
                    parentHref="/student/home"
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por escenario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        onRowClick={(row) => router.push(`/session/${row.id}`)}
                        emptyMessage="Aún no tienes sesiones registradas en tu historial."
                        enablePagination={true}
                    />
                </div>
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
