'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import {
    collection, query, where, orderBy, limit,
    getDocs, getDoc, doc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { SessionModel } from '@/models/session';
import {
    Users, AlertTriangle, Monitor,
    Database, Activity, GraduationCap, Clock3, BookOpenCheck, Award, UserCheck, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { DashboardHero } from '@/components/ui/dashboard-hero';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';
import { useOperationalMetrics } from '@/features/operations/hooks/use-operational-metrics';
import type { OperationalMetric } from '@/features/operations/services/operational-metrics.service';

interface DashStats {
    activeSessions: number;
    onlineDevices: number;
    totalDevices: number;
    averageScore: number;
    instructorsCount: number;
    studentsCount: number;
    recentLogs: { id: string; event: string; user: string; status: string; time: Date }[];
}

const EMPTY: DashStats = {
    activeSessions: 0, onlineDevices: 0, totalDevices: 0,
    averageScore: 0, instructorsCount: 0, studentsCount: 0, recentLogs: [],
};

export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [institutionName, setInstitutionName] = useState('');
    const [stats, setStats] = useState<DashStats>(EMPTY);
    const [loading, setLoading] = useState(true);

    const institutionId: string | null = user?.institutionId ?? null;

    const operationalMetrics = useOperationalMetrics(institutionId);

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        const fetchStats = async () => {
            try {
                setLoading(true);

                // Institution name
                const instSnap = await getDoc(doc(db, 'institutions', institutionId));
                if (instSnap.exists()) setInstitutionName(instSnap.data().name ?? '');

                const thirtyMinsAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000));
                const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

                const safeQuery = async (q: any) => {
                    try { return await getDocs(q); } catch { return { docs: [], size: 0 } as any; }
                };

                const [sessionsSnap, membershipsSnap, manikinsSnap] = await Promise.all([
                    // Sessions de esta institución (últimas 50)
                    safeQuery(query(
                        collection(db, 'sessions'),
                        where('institutionId', '==', institutionId),
                        orderBy('startedAt', 'desc'),
                        limit(50),
                    )),
                    // Memberships activas de esta institución
                    safeQuery(query(
                        collection(db, 'memberships'),
                        where('institutionId', '==', institutionId),
                        where('isActive', '==', true),
                    )),
                    // Maniquíes (hardware físico — sin filtro de institución)
                    safeQuery(collection(db, 'manikins')),
                ]);

                const sessions = sessionsSnap.docs.map(d => ({
                    ...d.data(),
                    startedAt: (d.data().startedAt as Timestamp)?.toDate?.() ?? new Date(0),
                })) as (SessionModel & { startedAt: Date })[];

                const activeSessions = sessions.filter(s => s.startedAt > thirtyMinsAgo.toDate()).length;

                const scores = sessions.map(s => (s.metrics as any)?.qualityScore ?? 0).filter(Boolean);
                const averageScore = scores.length > 0
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0;

                const memberships = membershipsSnap.docs.map(d => d.data());
                const instructorsCount = memberships.filter(m => m.role === 'INSTRUCTOR').length;
                const studentsCount = memberships.filter(m =>
                    ['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL', 'STUDENT'].includes(m.role)
                ).length;

                const onlineDevices = manikinsSnap.docs.filter(d => {
                    const last = (d.data().lastConnection as Timestamp)?.toDate?.();
                    return last && last > fiveMinsAgo;
                }).length;

                setStats({
                    activeSessions,
                    onlineDevices,
                    totalDevices: manikinsSnap.size,
                    averageScore,
                    instructorsCount,
                    studentsCount,
                    recentLogs: sessions.slice(0, 10).map(s => ({
                        id: s.id,
                        event: 'Nueva Sesión RCP',
                        user: s.studentName ?? 'Desconocido',
                        status: ((s.metrics as any)?.qualityScore ?? 0) >= 85 ? 'success' : 'warning',
                        time: s.startedAt,
                    })),
                });
            } catch (err) {
                console.error('Error fetching admin stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [institutionId, authLoading]);

    const subtitle = institutionName || 'Panel Institucional';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)', color: 'var(--foreground)' }}>
            <Header title={institutionName || 'Dashboard'} />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>

                <DashboardHero subtitle={subtitle} />

                {!authLoading && !institutionId && !loading && (
                    <div style={{
                        padding: '20px 24px', borderRadius: 16, marginBottom: 24,
                        background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                        color: '#ef4444', fontWeight: 700, fontSize: 14,
                    }}>
                        Tu cuenta no tiene una institución asignada. Contacta al soporte.
                    </div>
                )}

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                    {[
                        { label: 'Dispositivos Online', value: `${stats.onlineDevices}`, sub: `${stats.totalDevices} vinculados`, icon: Monitor, color: 'var(--brand)' },
                        { label: 'Sesiones Activas', value: stats.activeSessions, sub: 'En los últimos 30 min', icon: Activity, color: '#10B981' },
                        { label: 'Instructores', value: stats.instructorsCount, sub: 'Plantilla docente', icon: GraduationCap, color: 'var(--clr-accent)' },
                        { label: 'Estudiantes', value: stats.studentsCount, sub: 'Alumnos matriculados', icon: Users, color: '#F59E0B' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: 'var(--card)', border: '1px solid var(--border)',
                            borderRadius: 20, padding: 24,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                                    <item.icon size={22} />
                                </div>
                                {item.label === 'Sesiones Activas' && stats.activeSessions > 0 && (
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', animation: 'ping 1.5s infinite' }} />
                                )}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>{loading ? '...' : item.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{item.sub}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    {/* Activity Feed */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Database size={20} style={{ color: 'var(--brand)' }} /> Actividad Reciente
                            </h3>
                            <button onClick={() => {
                                if (stats.recentLogs.length === 0) return toast.error('No hay datos para exportar');
                                downloadCsv(stats.recentLogs.map(l => ({
                                    Evento: l.event,
                                    Usuario: l.user,
                                    Estado: l.status === 'success' ? 'Éxito' : 'Advertencia',
                                    Hora: new Date(l.time).toLocaleString(),
                                })), 'log-actividad');
                                toast.success('CSV exportado');
                            }} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                Exportar CSV
                            </button>
                        </div>

                        {stats.recentLogs.length === 0 && !loading ? (
                            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                                No hay sesiones registradas aún en esta institución.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 0 }}>
                                {stats.recentLogs.map((log, i) => (
                                    <div key={i} style={{
                                        padding: '16px 0',
                                        borderBottom: i === stats.recentLogs.length - 1 ? 'none' : '1px solid var(--border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: log.status === 'success' ? '#10B981' : '#F59E0B',
                                            }} />
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{log.event}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Usuario: <span style={{ fontWeight: 600 }}>{log.user}</span></div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--border-strong)', fontWeight: 700 }}>
                                                {new Date(log.time).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Side panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ background: 'var(--card)', borderRadius: 24, padding: 24, color: 'var(--text-on-brand)', border: '1px solid var(--border)' }}>
                            <OperationalStatusPanel
                                metrics={operationalMetrics.data?.metrics || []}
                                loading={operationalMetrics.loading}
                                error={operationalMetrics.error}
                                onRefresh={operationalMetrics.refresh}
                            />
                        </div>

                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>Accesos Directos</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <QuickLink label="Usuarios" icon={Users} href="/admin/users" />
                                <QuickLink label="Dispositivos" icon={Monitor} href="/admin/devices" />
                                <QuickLink label="Cursos" icon={Monitor} href="/courses" />
                                <QuickLink label="Reportes" icon={AlertTriangle} href="/admin/reports" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes ping {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

const operationalIcons = {
    sessions24h: Clock3,
    activeUsersToday: UserCheck,
    activeCourses: BookOpenCheck,
    certificatesMonth: Award,
} satisfies Record<OperationalMetric['key'], any>;

function OperationalStatusPanel({ metrics, loading, error, onRefresh }: {
    metrics: OperationalMetric[]; loading: boolean; error: string | null; onRefresh: () => void;
}) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
                <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>ESTADO OPERACIONAL</h4>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Métricas en tiempo real</p>
                </div>
                <button type="button" onClick={onRefresh} disabled={loading} title="Actualizar" style={{
                    width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)',
                    background: 'var(--bg-surface)', color: 'var(--text-primary)',
                    display: 'grid', placeItems: 'center', cursor: loading ? 'wait' : 'pointer',
                }}>
                    <RefreshCw size={15} />
                </button>
            </div>

            {error ? (
                <div style={{ padding: 14, borderRadius: 16, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', color: '#FCA5A5', fontSize: 12, fontWeight: 700 }}>
                    No se pudo cargar el estado operacional.
                </div>
            ) : loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ height: 72, borderRadius: 18, background: 'rgba(51,65,85,.72)', animation: 'pulse 1.4s infinite' }} />
                    ))}
                </div>
            ) : metrics.length === 0 ? (
                <div style={{ padding: 18, borderRadius: 18, background: 'rgba(51,65,85,.72)', color: 'var(--border-strong)', fontSize: 13 }}>
                    Sin métricas disponibles.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {metrics.map(metric => <OperationalMetricItem key={metric.key} metric={metric} />)}
                </div>
            )}
        </div>
    );
}

function OperationalMetricItem({ metric }: { metric: OperationalMetric }) {
    const Icon = operationalIcons[metric.key];
    const statusColor = metric.status === 'active' ? '#22C55E' : metric.status === 'warning' ? '#F59E0B' : 'var(--clr-accent)';
    return (
        <div style={{ padding: 14, borderRadius: 18, background: 'var(--bg-surface)', border: '1px solid rgba(148,163,184,.14)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 14, display: 'grid', placeItems: 'center', color: statusColor, background: `${statusColor}18` }}>
                        <Icon size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metric.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{metric.subtitle}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 900, color: 'var(--text-primary)' }}>
                        {new Intl.NumberFormat('es-CO').format(metric.value)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: 5 }}>real</div>
                </div>
            </div>
        </div>
    );
}

function QuickLink({ label, icon: Icon, href }: { label: string; icon: any; href: string }) {
    return (
        <Link href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px',
            borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--border)',
            textDecoration: 'none', transition: 'all 0.2s ease',
        }}>
            <Icon size={20} style={{ color: 'var(--brand)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
        </Link>
    );
}
