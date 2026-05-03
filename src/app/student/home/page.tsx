'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { StatCard } from '@/components/ui/stat-card';
import { Activity, TrendingUp, Award, Gauge, Smartphone, Clock, ChevronRight, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function StudentHomePage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const { sessions, stats, loading } = useDashboardData();

    const firstName = user?.firstName ?? 'Estudiante';
    const today = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const chartData = sessions.slice(0, 10).reverse().map((s, i) => ({
        name: `S${i + 1}`,
        score: s.metrics?.score ?? 0,
        profundidad: s.metrics?.averageDepthMm ?? 0,
    }));

    return (
        <div style={{ maxWidth: 1200 }}>
            {/* HEADER DE BIENVENIDA */}
            <div style={{
                background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 32px',
                marginBottom: '24px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6, textTransform: 'capitalize' }}>
                        {today}
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
                        Bienvenido, {firstName} 👋
                    </h1>
                    <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>
                        {stats.totalSessions === 0
                            ? 'Aún no tienes sesiones. Descarga la app para comenzar.'
                            : `Tu puntaje promedio es ${stats.averageScore}%.`
                        }
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button
                            onClick={() => router.push('/student/download')}
                            style={{
                                background: 'white', color: 'var(--brand)',
                                border: 'none', borderRadius: 'var(--radius-md)',
                                padding: '8px 16px', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            <Smartphone size={14} /> Descargar App
                        </button>
                    </div>
                </div>
            </div>

            {/* STAT CARDS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <StatCard label="Sesiones totales" value={loading ? '...' : stats.totalSessions} icon={Activity} color="var(--brand)" />
                <StatCard label="Score promedio" value={loading ? '...' : `${stats.averageScore}%`} icon={TrendingUp} color="var(--aha-good)" />
                <StatCard label="Mejor score" value={loading ? '...' : `${stats.bestScore}%`} icon={Award} color="var(--aha-warn)" />
                <StatCard label="Prof. promedio" value={loading ? '...' : `${stats.averageDepthMm} mm`} icon={Gauge} color="var(--info-text)" />
            </div>

            {/* CONTENIDO PRINCIPAL — 2 columnas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: '16px',
                marginBottom: '16px',
            }}>
                {/* GRÁFICA DE PROGRESIÓN */}
                <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                                Progresión de puntajes
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                                Últimas {chartData.length} sesiones
                            </p>
                        </div>
                    </div>

                    {chartData.length === 0 ? (
                        <div style={{
                            height: 200, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--text-muted)',
                            fontSize: 14, flexDirection: 'column', gap: 8,
                        }}>
                            <TrendingUp size={32} color="var(--border)" />
                            <span>Sin sesiones para graficar</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                                <ReferenceLine y={80} stroke="var(--aha-warn)" strokeDasharray="4 4" label={{ value: 'Mín. 80%', fontSize: 11, fill: 'var(--aha-warn)' }} />
                                <Line type="monotone" dataKey="score" stroke="var(--brand)" strokeWidth={2.5} dot={{ fill: 'var(--brand)', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} name="Score AHA" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* DISPOSITIVO */}
                <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                        Mi dispositivo
                    </h3>
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '24px 0', gap: 12,
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: 'var(--bg-surface-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Gauge size={24} color="var(--text-muted)" />
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            Sin dispositivo asignado
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                            Contacta a tu instructor para que te asigne un maniquí
                        </p>
                    </div>
                </div>
            </div>

            {/* SESIONES RECIENTES */}
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                marginBottom: '16px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        Sesiones recientes
                    </h3>
                    <button
                        onClick={() => router.push('/student/history')}
                        style={{
                            background: 'transparent', border: 'none',
                            color: 'var(--brand)', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                    >
                        Ver todo <ChevronRight size={14} />
                    </button>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando sesiones...</p>
                ) : sessions.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 8 }}>
                        <Clock size={32} color="var(--border)" />
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>No hay sesiones registradas</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Descarga la app móvil para iniciar tu entrenamiento</p>
                    </div>
                ) : (
                    <div>
                        {sessions.slice(0, 5).map((session, i) => {
                            const score = session.metrics?.score ?? 0;
                            const scoreColor = score >= 85 ? 'var(--aha-good)' : score >= 70 ? 'var(--aha-warn)' : 'var(--aha-danger)';
                            const date = session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt);

                            return (
                                <div
                                    key={session.id ?? i}
                                    onClick={() => router.push(`/student/session/${session.id}`)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 0',
                                        borderBottom: i < Math.min(sessions.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                            background: 'var(--brand-light)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Activity size={16} color="var(--brand)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {session.scenarioTitle || 'Sesión de entrenamiento'}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>{score}%</span>
                                        <ChevronRight size={14} color="var(--text-muted)" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* BANNER DE DESCARGA */}
            <div style={{
                background: 'linear-gradient(135deg, var(--brand-light) 0%, var(--bg-surface) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 'var(--radius-md)',
                        background: 'var(--brand)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Download size={24} color="white" />
                    </div>
                    <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                            Descarga la app móvil
                        </h4>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            Entrena con sensores ESP32 y recibe feedback en tiempo real AHA 2025
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/student/download')}
                    style={{
                        background: 'var(--brand)', color: 'white',
                        border: 'none', borderRadius: 'var(--radius-md)',
                        padding: '10px 20px', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <Smartphone size={14} /> Descargar
                </button>
            </div>
        </div>
    );
}