'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import { Clock, User, Book, BarChart, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch last 50 sessions
        SessionService.getAllRecent(50)
            .then(setSessions)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Sesiones en vivo" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader
                    title="Monitor de sesiones"
                    subtitle="Historial reciente y sesiones activas en la plataforma"
                />

                <div style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{
                                background: 'var(--muted)',
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid var(--border)'
                            }}>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Alumno / Fecha</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Curso / Escenario</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>Score</th>
                                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>Estado AHA</th>
                                <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={5} style={{ padding: 20 }}><div style={{ height: 40, background: 'var(--muted)', borderRadius: 8, animation: 'pulse 2s infinite' }} /></td></tr>
                                ))
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: 64, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                            <Clock size={40} style={{ color: 'var(--border)' }} />
                                            <p>No hay sesiones registradas recientemente</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--muted)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{s.studentName}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatDate(s.startedAt)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Book size={14} style={{ color: 'var(--text-muted)' }} />
                                                <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s.courseId || 'Práctica Libre'}</div>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 22 }}>{s.scenarioTitle}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 15,
                                                color: (s.metrics?.qualityScore || 0) >= 85 ? '#059669' : '#DC2626'
                                            }}>
                                                <BarChart size={14} />
                                                {s.metrics?.qualityScore || 0}%
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                                                background: (s.metrics?.qualityScore || 0) >= 85 ? '#DCFCE7' : '#FEE2E2',
                                                color: (s.metrics?.qualityScore || 0) >= 85 ? '#166534' : '#991B1B'
                                            }}>
                                                {(s.metrics?.qualityScore || 0) >= 85 ? 'APROBADO' : 'REPROBADO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                            <ChevronRight size={18} style={{ color: 'var(--border)', cursor: 'pointer' }} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
