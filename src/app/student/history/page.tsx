'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import { Clock, Activity, BarChart, ChevronRight, History } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function StudentHistoryPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        SessionService.getByStudent(user.uid, 50)
            .then(setSessions)
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Mi Historial" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader title="Mi Historial" subtitle="Revisa tu rendimiento en sesiones pasadas" />

                {loading ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{ height: 60, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E4F0', animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 16, padding: 64, textAlign: 'center' }}>
                        <History size={48} style={{ color: '#E2E4F0', marginBottom: 16 }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Aún no tienes sesiones</h3>
                        <p style={{ color: '#64748B', fontSize: 14 }}>Tus prácticas aparecerán aquí una vez que completes tu primera sesión.</p>
                    </div>
                ) : (
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E4F0', color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Fecha y Hora</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Escenario</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>Calidad</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>Estado</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Clock size={14} style={{ color: '#94A3B8' }} />
                                                <div style={{ fontWeight: 500, color: '#475569' }}>{formatDate(s.startedAt)}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Activity size={14} style={{ color: '#94A3B8' }} />
                                                <div style={{ color: '#0F172A', fontWeight: 600 }}>{s.scenarioTitle || 'Sesión RCP'}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <div style={{ 
                                                fontSize: 15, fontWeight: 700, 
                                                color: (s.metrics?.qualityScore || 0) >= 85 ? '#059669' : '#DC2626'
                                            }}>
                                                {s.metrics?.qualityScore || 0}%
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <span style={{ 
                                                fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                                                background: (s.metrics?.qualityScore || 0) >= 85 ? '#DCFCE7' : '#FEE2E2',
                                                color: (s.metrics?.qualityScore || 0) >= 85 ? '#166534' : '#991B1B'
                                            }}>
                                                {(s.metrics?.qualityScore || 0) >= 85 ? 'APROBADO' : 'FALLIDO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                            <ChevronRight size={18} style={{ color: '#E2E4F0', cursor: 'pointer' }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
