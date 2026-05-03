'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/stores/auth-store';
import { SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';

export default function StudentHistoryPage() {
    const user = useAuthStore((s) => s.user);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        SessionService.getByStudent(user.uid, 50)
            .then(setSessions)
            .finally(() => setLoading(false));
    }, [user]);

    const formatDate = (d: Date) =>
        d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getScoreBg = (score: number) => {
        if (score >= 85) return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
        if (score >= 70) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' };
        return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' };
    };

    return (
        <div style={{ padding: 24 }}>
            <PageHeader title="Historial" subtitle="Tus sesiones de entrenamiento" />

            {loading ? (
                <p style={{ color: '#8892A4', fontSize: 13 }}>Cargando...</p>
            ) : sessions.length === 0 ? (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    padding: 40,
                    textAlign: 'center',
                }}>
                    <p style={{ color: '#8892A4' }}>No hay sesiones registradas</p>
                </div>
            ) : (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    overflow: 'hidden',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#F0F1FA', color: '#4A5568', fontSize: 12, textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Fecha</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Escenario</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s) => {
                                const c = getScoreBg(s.metrics?.score ?? 0);
                                return (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #E2E4F0' }}>
                                        <td style={{ padding: '12px 16px', color: '#8892A4' }}>{formatDate(s.startedAt)}</td>
                                        <td style={{ padding: '12px 16px', color: '#4A5568' }}>{s.scenarioTitle ?? 'Sesión RCP'}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 600, color: c.color }}>
                                            {s.metrics?.score ?? 0}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
