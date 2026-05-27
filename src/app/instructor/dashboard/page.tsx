'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService, SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import type { CourseModel } from '@/models/course';
import {
    Users, Activity, BarChart3, ShieldCheck,
    ArrowUpRight, Clock, GraduationCap, Lightbulb,
    ChevronRight, Zap
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { DashboardHero } from '@/components/ui/dashboard-hero';
import { XpStrip } from '@/components/ui/xp-strip';

export default function InstructorDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        activeStudents: 0,
        averageScore: 0,
        ahaCompliance: 0,
        totalSessions: 0,
        recentSessions: [] as SessionModel[],
        courses: [] as CourseModel[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const courses = await CourseService.getByInstructor(user.uid);

                let totalStudents = 0;
                let allSessions: SessionModel[] = [];

                const courseSessions = await Promise.all(
                    courses.map(async (c) => {
                        totalStudents += c.studentCount || 0;
                        return SessionService.getByCourse(c.id);
                    })
                );

                allSessions = courseSessions.flat();

                const scores = allSessions.map(s => s.metrics?.qualityScore || 0);
                const avgScore = scores.length > 0
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0;

                const passingSessions = allSessions.filter(s => (s.metrics?.qualityScore || 0) >= 85);
                const compliance = allSessions.length > 0
                    ? Math.round((passingSessions.length / allSessions.length) * 100)
                    : 0;

                setStats({
                    activeStudents: totalStudents,
                    averageScore: avgScore,
                    ahaCompliance: compliance,
                    totalSessions: allSessions.length,
                    recentSessions: allSessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, 5),
                    courses: courses
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const getStatusColor = (value: number, min: number) => value >= min ? '#10B981' : '#F59E0B';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Mission Control" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <DashboardHero subtitle="CONSOLA DE INSTRUCTOR" />

                {/* XP Level Bar */}
                {user && (
                    <div style={{ marginBottom: 28 }}>
                        <XpStrip userId={user.uid} />
                    </div>
                )}

                {/* Grid de Métricas de Alto Impacto */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                    {[
                        { label: 'Alumnos Supervisados', value: stats.activeStudents, icon: Users, color: 'var(--brand)', sub: 'En todos tus cursos' },
                        { label: 'Calidad Promedio', value: `${stats.averageScore}%`, icon: Zap, color: getStatusColor(stats.averageScore, 85), sub: 'Meta AHA: 85%' },
                        { label: 'Tasa de Aprobación', value: `${stats.ahaCompliance}%`, icon: ShieldCheck, color: getStatusColor(stats.ahaCompliance, 80), sub: 'Sesiones certificables' },
                        { label: 'Sesiones Totales', value: stats.totalSessions, icon: Activity, color: 'var(--clr-accent)', sub: 'Histórico acumulado' },
                    ].map((m, i) => (
                        <div key={i} style={{
                            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                                    <m.icon size={22} />
                                </div>
                                <ArrowUpRight size={18} style={{ color: 'var(--border-strong)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{m.label}</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>{loading ? '...' : m.value}</div>
                                <div style={{ fontSize: 11, color: m.color, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{m.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
                    {/* Panel de Actividad Reciente */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Clock size={20} style={{ color: 'var(--brand)' }} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Últimas Sesiones</h3>
                            </div>
                            <Link href="/instructor/monitor" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Ver todo</Link>
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            {stats.recentSessions.length === 0 ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No hay actividad reciente</div>
                            ) : (
                                stats.recentSessions.map((s, i) => (
                                    <div key={i} style={{
                                        padding: '16px 20px', borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--muted)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                                                <GraduationCap size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: 14 }}>{s.studentName}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.scenarioTitle} • {formatDate(s.startedAt)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: getStatusColor(s.metrics?.qualityScore ?? 0, 85) }}>{s.metrics?.qualityScore ?? 0}%</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>CALIDAD</div>
                                            </div>
                                            <ChevronRight size={18} style={{ color: 'var(--border-strong)' }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* AHA 2025 Education Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--brand) 0%, var(--clr-accent) 100%)',
                            borderRadius: 24, padding: 24, color: 'var(--text-on-brand)', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.2)'
                        }}>
                            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                                <Lightbulb size={120} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 }}>
                                    <Lightbulb size={18} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em' }}>CONSEJO AHA 2025</span>
                            </div>
                            <p style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                                "La profundidad de las compresiones debe ser de al menos 5 cm pero no más de 6 cm. Permite la expansión torácica completa después de cada compresión."
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>Acciones Rápidas</h4>
                            <div style={{ display: 'grid', gap: 10 }}>
                                <Link href="/instructor/courses/create" style={{
                                    padding: '12px 16px', borderRadius: 12, background: 'var(--accent)', color: 'var(--brand)',
                                    textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10
                                }}>
                                    <Plus size={16} /> Crear Nuevo Curso
                                </Link>
                                <Link href="/instructor/monitor" style={{
                                    padding: '12px 16px', borderRadius: 12, background: 'var(--muted)', color: 'var(--text-secondary)',
                                    textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)'
                                }}>
                                    <Activity size={16} /> Abrir Monitor Live
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `}</style>
        </div>
    );
}

function Plus({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7v14" /></svg>;
}
