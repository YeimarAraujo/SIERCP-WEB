'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { SessionService, ManiquiService, CourseService, UserService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import type { ManiquiModel } from '@/models/device';
import { 
    Cpu, Globe, Shield, Users, Server, 
    Signal, AlertTriangle, TrendingUp,
    Settings, Search, Bell, Monitor,
    HardDrive, Database, RefreshCw, Activity, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { DashboardHero } from '@/components/ui/dashboard-hero';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
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
                const students = users.filter(u => u.role === 'ESTUDIANTE');

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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>
            <Header title="Network Operations Center" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                
                <DashboardHero subtitle="INFRAESTRUCTURA GLOBAL / NOC" />

                {/* Performance & Capacity Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                    {[
                        { label: 'Dispositivos Online', value: `${stats.onlineDevices}`, sub: `${stats.totalDevices} vinculados`, icon: Monitor, color: '#1800AD' },
                        { label: 'Sesiones Activas', value: stats.activeSessions, sub: 'En los últimos 30 min', icon: Activity, color: '#10B981' },
                        { label: 'Instructores', value: (stats as any).instructorsCount || 0, sub: 'Plantilla docente', icon: GraduationCap, color: '#6366F1' },
                        { label: 'Estudiantes', value: (stats as any).studentsCount || 0, sub: 'Alumnos matriculados', icon: Users, color: '#F59E0B' },
                    ].map((item, i) => (
                        <div key={i} style={{ 
                            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24,
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
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#1E293B' }}>{loading ? '...' : item.value}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 4 }}>{item.sub}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    {/* Activity Feed */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Database size={20} style={{ color: '#1800AD' }} /> Log de Actividad Global
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
                            }} style={{ background: 'none', border: 'none', color: '#1800AD', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Exportar CSV</button>
                        </div>
                        
                        <div style={{ display: 'grid', gap: 0 }}>
                            {stats.recentLogs.map((log, i) => (
                                <div key={i} style={{ 
                                    padding: '16px 0', borderBottom: i === stats.recentLogs.length - 1 ? 'none' : '1px solid #F1F5F9',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ 
                                            width: 8, height: 8, borderRadius: '50%', 
                                            background: log.status === 'success' ? '#10B981' : '#F59E0B'
                                        }} />
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{log.event}</div>
                                            <div style={{ fontSize: 12, color: '#64748B' }}>Usuario: <span style={{ fontWeight: 600 }}>{log.user}</span></div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                                            {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 700 }}>{new Date(log.time).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources & Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ background: '#1E293B', borderRadius: 24, padding: 24, color: '#FFFFFF' }}>
                            <h4 style={{ margin: '0 0 20px 0', fontSize: 15, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }}>RECURSOS CLOUD</h4>
                            <div style={{ display: 'grid', gap: 20 }}>
                                <ResourceItem label="Almacenamiento DB" progress={42} icon={Database} />
                                <ResourceItem label="Ancho de Banda" progress={18} icon={Signal} />
                                <ResourceItem label="Uso de API" progress={65} icon={Server} />
                            </div>
                        </div>

                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24 }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 800, color: '#1E293B' }}>Accesos Directos</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <QuickLink label="Usuarios" icon={Users} href="/admin/users" />
                                <QuickLink label="Dispositivos" icon={Monitor} href="/admin/devices" />
                                <QuickLink label="Cursos" icon={Monitor} href="/courses" />
                                <QuickLink label="Alertas" icon={AlertTriangle} href="/admin/alerts" />
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

function ResourceItem({ label, progress, icon: Icon }: { label: string, progress: number, icon: any }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={14} style={{ color: '#6366F1' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>{label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#6366F1' }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#6366F1', borderRadius: 3 }} />
            </div>
        </div>
    );
}

function QuickLink({ label, icon: Icon, href }: { label: string, icon: any, href: string }) {
    return (
        <Link href={href} style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px',
            borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', textDecoration: 'none',
            transition: 'all 0.2s ease'
        }}>
            <Icon size={20} style={{ color: '#1800AD' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{label}</span>
        </Link>
    );
}
