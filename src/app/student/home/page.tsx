'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { useAuthStore } from '@/stores/auth-store';
import { SessionService } from '@/services/firestore.service';
import { StudentEnrollmentService } from '@/services/student-enrollment.service';
import type { SessionModel } from '@/models/session';
import type { StudentCourseCard } from '@/shared/types/student-course-card';
import { 
    Activity, GraduationCap, Award, BookOpen, 
    Zap, Clock, ChevronRight, Signal,
    Monitor, Layout, Calendar
} from 'lucide-react';
import { DashboardHero } from '@/components/ui/dashboard-hero';
import Link from 'next/link';

export default function StudentHomePage() {
    const user = useAuthStore((s) => s.user);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [courses, setCourses] = useState<StudentCourseCard[]>([]);
    const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Obtener cursos en los que está inscrito el estudiante (unificado)
                const coursesData = await StudentEnrollmentService.getStudentCourses(user.uid);
                setCourses(coursesData);

                // 2. Obtener sesiones recientes del estudiante
                const userSessions = await SessionService.getByStudent(user.uid, 50);

                // 3. Unificar, deduplicar y validar
                const uniqueSessions = Array.from(new Map(userSessions.map(s => [s.id, s])).values())
                    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

                setSessions(uniqueSessions);

                // 4. Obtener el conteo real total
                const count = await SessionService.getCountByStudent(user.uid);
                setTotalSessionsCount(count);
            } catch (e) {
                console.error('Error fetching data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const calculatedTotalSessions = totalSessionsCount > 0 ? totalSessionsCount : sessions.length;
    const calculatedAverageScore = sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + ((s.metrics as any)?.qualityScore ?? (s.metrics as any)?.score ?? 0), 0) / sessions.length)
        : 0;
    const calculatedBestScore = sessions.length > 0 
        ? Math.round(Math.max(...sessions.map(s => (s.metrics as any)?.qualityScore ?? (s.metrics as any)?.score ?? 0))) 
        : 0;

    const stats = {
        totalSessions: calculatedTotalSessions,
        averageScore: calculatedAverageScore,
        bestScore: calculatedBestScore,
        activeCourses: courses.length,
    };

    const formatSessionDate = (d: Date) =>
        d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }).toUpperCase();

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return '#10B981';
        if (score >= 70) return '#F59E0B';
        return '#EF4444';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Panel del Estudiante" />
            
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <DashboardHero subtitle="TU PROGRESO ACADÉMICO" />

                {/* Resumen de Impacto */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 20, 
                    marginBottom: 32 
                }}>
                    {[
                        { label: 'Sesiones Totales', value: stats.totalSessions, icon: Activity, color: '#1800AD', sub: 'Prácticas RCP' },
                        { label: 'Score Promedio', value: `${stats.averageScore}%`, icon: Zap, color: getScoreColor(stats.averageScore), sub: 'Calidad AHA' },
                        { label: 'Mejor Desempeño', value: `${stats.bestScore}%`, icon: Award, color: '#10B981', sub: 'Récord personal' },
                        { label: 'Cursos Activos', value: stats.activeCourses, icon: BookOpen, color: '#6366F1', sub: 'Matrículas vigentes' },
                    ].map((m, i) => (
                        <div key={i} style={{
                            background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 20, padding: 24,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12
                        }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                                <m.icon size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{m.label}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{loading ? '...' : m.value}</div>
                                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginTop: 4 }}>{m.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    {/* Sesiones Recientes */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Clock size={20} style={{ color: '#1800AD' }} /> Actividad Reciente
                            </h3>
                            <Link href="/student/reports" style={{ fontSize: 13, color: '#1800AD', fontWeight: 700, textDecoration: 'none' }}>Ver Reportes</Link>
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            {loading ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>Cargando actividad...</div>
                            ) : sessions.length === 0 ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>No hay sesiones registradas</div>
                            ) : (
                                sessions.slice(0, 5).map((s) => (
                                    <div key={s.id} style={{
                                        padding: '16px 20px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #F1F5F9',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD' }}>
                                                <GraduationCap size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{s.scenarioTitle ?? 'Sesión RCP'}</div>
                                                <div style={{ fontSize: 12, color: '#64748B' }}>{formatSessionDate(s.startedAt)} • {formatDuration(s.duration)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: getScoreColor(s.metrics?.qualityScore || 0) }}>
                                                    {Math.round(s.metrics?.qualityScore || 0)}%
                                                </div>
                                                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>CALIDAD</div>
                                            </div>
                                            <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Mis Cursos Quick Link */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #1800AD 0%, #6366F1 100%)', borderRadius: 24, padding: 32, color: '#FFFFFF',
                        boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.2)', position: 'relative', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%'
                    }}>
                        <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                            <GraduationCap size={120} />
                        </div>
                        <h4 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, position: 'relative' }}>Tu Formación Continúa</h4>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 24, lineHeight: 1.6, position: 'relative' }}>
                            Revisa tus cursos activos, descarga material de estudio y prepárate para tu próxima certificación AHA.
                        </p>
                        <Link href="/student/courses" style={{
                            background: '#FFFFFF', color: '#1800AD', padding: '12px 24px', borderRadius: 12,
                            fontWeight: 800, fontSize: 13, textDecoration: 'none', textAlign: 'center',
                            display: 'inline-block', transition: 'all 0.2s', width: 'fit-content'
                        }}>
                            Ver mis cursos
                        </Link>
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
