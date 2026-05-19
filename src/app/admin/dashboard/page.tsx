'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { SessionService, ManiquiService, UserService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import type { ManiquiModel } from '@/models/device';
import { 
    Users,
    AlertTriangle,
    Monitor,
    Database, Activity, GraduationCap, Clock3, BookOpenCheck, Award, UserCheck, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { DashboardHero } from '@/components/ui/dashboard-hero';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';
import { useOperationalMetrics } from '@/features/operations/hooks/use-operational-metrics';
import type { OperationalMetric } from '@/features/operations/services/operational-metrics.service';

export default function AdminDashboardPage() {
    const operationalMetrics = useOperationalMetrics();
    const [stats, setStats] = useState({
        activeSessions: 0,
        onlineDevices: 0,
        totalDevices: 0,
        averageScore: 0,
        totalUsers: 0,
        instructorsCount: 0,
        studentsCount: 0,
        recentLogs: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                setLoading(true);
                const [devices, allRecent, users] = await Promise.all([
                    ManiquiService.getAll(),
                    SessionService.getAllRecent(10),
                    UserService.getAll()
                ]);

                const now = new Date();
                const online = devices.filter((d: ManiquiModel) => {
                    if (!d.lastConnection) return false;
                    const diff = now.getTime() - d.lastConnection.getTime();
                    return diff < 1000 * 60 * 5;
                });

                const thirtyMinsAgo = new Date(now.getTime() - 1000 * 60 * 30);
                const active = allRecent.filter((s: SessionModel) => s.startedAt > thirtyMinsAgo).length;

                const scores = allRecent.map((s: SessionModel) => s.metrics?.qualityScore || 0);
                const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

                const instructors = users.filter(u => u.role === 'INSTRUCTOR');
                const students = users.filter(u => ['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL'].includes(u.role));

                setStats({
                    activeSessions: active,
                    onlineDevices: online.length,
                    totalDevices: devices.length,
                    averageScore: avg,
                    totalUsers: users.length,
                    instructorsCount: instructors.length,
                    studentsCount: students.length,
                    recentLogs: allRecent.map((s: SessionModel) => ({
                        id: s.id,
                        event: 'Nueva Sesión RCP',
                        user: s.studentName,
                        status: (s.metrics?.qualityScore ?? 0) >= 85 ? 'success' : 'warning',
                        time: s.startedAt
                    }))
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalStats();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background)', color: 'var(--foreground)' }}>
            <Header title="Network Operations Center" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                
                <DashboardHero subtitle="INFRAESTRUCTURA GLOBAL / NOC" />

                {/* Performance & Capacity Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                    {[
                        { label: 'Dispositivos Online', value: `${stats.onlineDevices}`, sub: `${stats.totalDevices} vinculados`, icon: Monitor, color: 'var(--brand)' },
                        { label: 'Sesiones Activas', value: stats.activeSessions, sub: 'En los últimos 30 min', icon: Activity, color: '#10B981' },
                        { label: 'Instructores', value: (stats as any).instructorsCount || 0, sub: 'Plantilla docente', icon: GraduationCap, color: 'var(--clr-accent)' },
                        { label: 'Estudiantes', value: (stats as any).studentsCount || 0, sub: 'Alumnos matriculados', icon: Users, color: '#F59E0B' },
                    ].map((item, i) => (
                        <div key={i} style={{ 
                            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
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
                                <Database size={20} style={{ color: 'var(--brand)' }} /> Log de Actividad Global
                            </h3>
                            <button onClick={() => {
                                if (stats.recentLogs.length === 0) return toast.error('No hay datos para exportar');
                                downloadCsv(stats.recentLogs.map(l => ({
                                    Evento: l.event,
                                    Usuario: l.user,
                                    Estado: l.status === 'success' ? 'Éxito' : 'Advertencia',
                                    Hora: new Date(l.time).toLocaleString()
                                })), 'log-actividad-global');
                                toast.success('CSV exportado');
                            }} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Exportar CSV</button>
                        </div>
                        
                        <div style={{ display: 'grid', gap: 0 }}>
                            {stats.recentLogs.map((log, i) => (
                                <div key={i} style={{ 
                                    padding: '16px 0', borderBottom: i === stats.recentLogs.length - 1 ? 'none' : '1px solid var(--border)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ 
                                            width: 8, height: 8, borderRadius: '50%', 
                                            background: log.status === 'success' ? '#10B981' : '#F59E0B'
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
                                        <div style={{ fontSize: 10, color: 'var(--border-strong)', fontWeight: 700 }}>{new Date(log.time).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources & Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ background: 'var(--foreground)', borderRadius: 24, padding: 24, color: 'var(--text-on-brand)' }}>
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

function OperationalStatusPanel({
    metrics,
    loading,
    error,
    onRefresh,
}: {
    metrics: OperationalMetric[];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
}) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
                <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ESTADO OPERACIONAL</h4>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Métricas reales desde Firestore</p>
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    title="Actualizar estado operacional"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,.22)',
                        background: 'rgba(255,255,255,.06)',
                        color: 'var(--border-strong)',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: loading ? 'wait' : 'pointer',
                    }}
                >
                    <RefreshCw size={15} />
                </button>
            </div>

            {error ? (
                <div style={{ padding: 14, borderRadius: 16, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', color: '#FCA5A5', fontSize: 12, fontWeight: 700 }}>
                    No se pudo cargar el estado operacional.
                </div>
            ) : loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} style={{ height: 72, borderRadius: 18, background: 'rgba(51,65,85,.72)', animation: 'pulse 1.4s infinite' }} />
                    ))}
                </div>
            ) : metrics.length === 0 ? (
                <div style={{ padding: 18, borderRadius: 18, background: 'rgba(51,65,85,.72)', color: 'var(--border-strong)', fontSize: 13 }}>
                    No hay métricas operacionales disponibles.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {metrics.map((metric) => (
                        <OperationalMetricItem key={metric.key} metric={metric} />
                    ))}
                </div>
            )}
        </div>
    );
}

function OperationalMetricItem({ metric }: { metric: OperationalMetric }) {
    const Icon = operationalIcons[metric.key];
    const statusColor = metric.status === 'active' ? '#22C55E' : metric.status === 'warning' ? '#F59E0B' : 'var(--clr-accent)';

    return (
        <div style={{
            padding: 14,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(51,65,85,.92), rgba(15,23,42,.72))',
            border: '1px solid rgba(148,163,184,.14)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 14,
                        display: 'grid',
                        placeItems: 'center',
                        color: statusColor,
                        background: `${statusColor}18`,
                    }}>
                        <Icon size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metric.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{metric.subtitle}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 900, color: 'var(--text-on-brand)' }}>
                        {new Intl.NumberFormat('es-CO').format(metric.value)}
                    </div>
                    <div title={metric.source} style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginTop: 5 }}>
                        real
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickLink({ label, icon: Icon, href }: { label: string, icon: any, href: string }) {
    return (
        <Link href={href} style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px',
            borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--border)', textDecoration: 'none',
            transition: 'all 0.2s ease'
        }}>
            <Icon size={20} style={{ color: 'var(--brand)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
        </Link>
    );
}
