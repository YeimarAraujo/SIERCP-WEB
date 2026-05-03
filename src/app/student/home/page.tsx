'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { useAuthStore } from '@/stores/auth-store';
import { SessionService, CourseService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import type { CourseModel } from '@/models/course';

export default function StudentHomePage() {
    const user = useAuthStore((s) => s.user);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const [sessionsData, coursesData] = await Promise.all([
                    SessionService.getByStudent(user.uid, 20),
                    CourseService.getAll(),
                ]);
                setSessions(sessionsData);
                setCourses(coursesData);
            } catch (e) {
                console.error('Error fetching data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const stats = {
        totalSessions: user?.stats?.totalSessions ?? sessions.length,
        averageScore: user?.stats?.averageScore ??
            (sessions.length > 0
                ? Math.round(sessions.reduce((acc, s) => acc + (s.metrics?.score ?? 0), 0) / sessions.length)
                : 0),
        bestScore: user?.stats?.bestScore ?? 0,
        activeCourses: courses.length,
    };

    const formatDate = () =>
        new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const formatSessionDate = (d: Date) =>
        d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }).toUpperCase();

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getScoreBg = (score: number) => {
        if (score >= 85) return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
        if (score >= 70) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' };
        return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' };
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E4F0',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
            }}>
                <p style={{ fontSize: 12, color: '#8892A4', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {formatDate()}
                </p>
                <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0B1C30', margin: '0 0 4px' }}>
                    Bienvenido, {user?.firstName ?? 'Usuario'}
                </h1>
                <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>
                    Aquí está tu progreso de esta semana
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 24,
            }}>
                <StatCard label="Sesiones totales" value={stats.totalSessions} />
                <StatCard label="Score promedio" value={`${stats.averageScore}%`} />
                <StatCard label="Mejor score" value={`${stats.bestScore}%`} />
                <StatCard label="Cursos activos" value={stats.activeCourses} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    padding: 20,
                }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0B1C30', marginBottom: 16 }}>
                        Sesiones recientes
                    </h3>
                    {loading ? (
                        <p style={{ color: '#8892A4', fontSize: 13 }}>Cargando...</p>
                    ) : sessions.length === 0 ? (
                        <p style={{ color: '#8892A4', fontSize: 13 }}>No hay sesiones registradas</p>
                    ) : (
                        sessions.slice(0, 5).map((s) => {
                            const c = getScoreBg(s.metrics?.score ?? 0);
                            return (
                                <div key={s.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #E2E4F0',
                                    fontSize: 13,
                                }}>
                                    <span style={{ color: '#8892A4' }}>{formatSessionDate(s.startedAt)}</span>
                                    <span style={{ color: '#4A5568' }}>{s.scenarioTitle ?? 'Sesión RCP'}</span>
                                    <span style={{ fontWeight: 600, color: c.color }}>{s.metrics?.score ?? 0}%</span>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    padding: 20,
                }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0B1C30', marginBottom: 16 }}>
                        Mi dispositivo
                    </h3>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: '#10B981', margin: '0 auto 12px',
                            boxShadow: '0 0 0 3px rgba(16,185,129,0.15)',
                        }} />
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#0B1C30' }}>SIERCP-01</p>
                        <p style={{ fontSize: 13, color: '#10B981' }}>Conectado</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
