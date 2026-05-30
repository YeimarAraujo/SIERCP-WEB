'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { SessionModel } from '@/models/session';
import { Clock, User, BookOpen, ChevronRight, Activity, Monitor } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminSessionsPage() {
    const { user, loading: authLoading } = useAuth();
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        const fetchSessions = async () => {
            try {
                const snap = await getDocs(query(
                    collection(db, 'sessions'),
                    where('institutionId', '==', institutionId),
                    orderBy('startedAt', 'desc'),
                    limit(50),
                ));
                setSessions(snap.docs.map(d => {
                    const data = d.data();
                    return {
                        ...data,
                        id: d.id,
                        startedAt: (data.startedAt as Timestamp)?.toDate?.() ?? new Date(0),
                    } as SessionModel;
                }));
            } catch (err) {
                console.error('Error fetching sessions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [institutionId, authLoading]);

    const activeSessions = sessions.filter(s => {
        const diff = Date.now() - s.startedAt.getTime();
        return diff < 1000 * 60 * 30;
    }).length;

    const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((a, s) => a + (s.metrics?.qualityScore || 0), 0) / sessions.length)
        : 0;

    const columns = [
        {
            key: 'studentName',
            label: 'Alumno / Fecha',
            render: (_: unknown, row: SessionModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                        <User size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: 14 }}>{row.studentName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(row.startedAt)}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'scenarioTitle',
            label: 'Escenario',
            render: (_: unknown, row: SessionModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOpen size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {row.scenarioTitle || 'Práctica Libre'}
                    </div>
                </div>
            ),
        },
        {
            key: 'qualityScore',
            label: 'Calidad AHA',
            render: (_: unknown, row: SessionModel) => {
                const score = row.metrics?.qualityScore || 0;
                const color = score >= 85 ? '#059669' : score >= 70 ? '#D97706' : '#DC2626';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--muted)', borderRadius: 3, minWidth: 60, overflow: 'hidden' }}>
                            <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 900, color, minWidth: 42 }}>{score}%</span>
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Estado AHA',
            render: (_: unknown, row: SessionModel) => {
                const score = row.metrics?.qualityScore || 0;
                const approved = score >= 85;
                return (
                    <span style={{
                        fontSize: 10, fontWeight: 900, padding: '5px 12px', borderRadius: 20,
                        background: approved ? '#DCFCE7' : '#FEE2E2',
                        color: approved ? '#166534' : '#991B1B',
                        letterSpacing: '0.05em',
                    }}>
                        {approved ? 'APROBADO' : 'REPROBADO'}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            label: '',
            render: () => <ChevronRight size={18} style={{ color: 'var(--border-strong)' }} />,
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Historial de Sesiones" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Historial de Sesiones"
                    subtitle="Registro histórico de sesiones completadas en la institución"
                    parentTitle="Panel de Control"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 18px', textAlign: 'center' }}>
                                <Activity size={20} color={activeSessions > 0 ? '#10B981' : 'var(--text-muted)'} />
                                <div style={{ fontSize: 10, color: 'var(--foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
                                    {activeSessions} activas
                                </div>
                            </div>
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 18px', textAlign: 'center' }}>
                                <Monitor size={20} color="var(--brand)" />
                                <div style={{ fontSize: 10, color: 'var(--foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
                                    {avgScore}% prom.
                                </div>
                            </div>
                        </div>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <DataTable
                        columns={columns}
                        data={sessions}
                        loading={loading}
                        emptyMessage="No hay sesiones registradas recientemente."
                        enablePagination={true}
                    />
                </div>
            </div>
        </div>
    );
}
