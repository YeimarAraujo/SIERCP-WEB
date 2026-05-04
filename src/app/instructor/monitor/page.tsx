'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService, SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import { 
    Activity, User, BarChart3, AlertTriangle, 
    Signal, Zap, Timer, Play, ChevronRight,
    Monitor, Users, ShieldCheck, HeartPulse
} from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

export default function InstructorMonitorPage() {
    const { user } = useAuth();
    const [activeSessions, setActiveSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchMonitorData = async () => {
            try {
                setLoading(true);
                const courses = await CourseService.getByInstructor(user.uid);
                const thirtyMinsAgo = new Date(Date.now() - 1000 * 60 * 30);
                const sessionPromises = courses.map(c => SessionService.getByCourse(c.id));
                const allSessions = (await Promise.all(sessionPromises)).flat();
                
                const recent = allSessions
                    .filter(s => s.startedAt > thirtyMinsAgo)
                    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

                setActiveSessions(recent);
            } catch (error) {
                console.error('Error fetching monitor data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMonitorData();
        const interval = setInterval(fetchMonitorData, 15000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Mission Control Center" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Monitor de Simulación" 
                    subtitle="Seguimiento en tiempo real de métricas AHA 2025"
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                />

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'flex-end' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{activeSessions.length} SESIONES ACTIVAS</span>
                </div>
            </div>

                {loading && activeSessions.length === 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: 260, background: '#FFFFFF', borderRadius: 24, border: '1px solid #E2E8F0', animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : activeSessions.length === 0 ? (
                    <div style={{ background: '#FFFFFF', border: '1px dashed #E2E8F0', borderRadius: 32, padding: '120px 0', textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 40, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#CBD5E1' }}>
                            <Monitor size={40} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Sin Transmisiones Entrantes</h3>
                        <p style={{ color: '#64748B', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>Inicia una sesión en el simulador SIERCP para comenzar a recibir datos de telemetría en tiempo real.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                        {activeSessions.map((s) => (
                            <div key={s.id} style={{ 
                                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: 20
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD', border: '1px solid rgba(24, 0, 173, 0.1)' }}>
                                            <User size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>{s.studentName}</div>
                                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{s.scenarioTitle}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ECFDF5', padding: '6px 12px', borderRadius: 10, color: '#10B981', fontSize: 11, fontWeight: 900, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'ping 1.5s infinite' }} />
                                        EN VIVO
                                    </div>
                                </div>

                                {/* High-Level Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                    <MetricBox label="Calidad" value={`${s.metrics?.qualityScore ?? 0}%`} color={(s.metrics?.qualityScore ?? 0) >= 85 ? '#10B981' : '#F59E0B'} icon={ShieldCheck} />
                                    <MetricBox label="Profundidad" value={`${(s.metrics?.averageDepthMm ?? 0).toFixed(0)}mm`} color="#0F172A" icon={Zap} />
                                    <MetricBox label="Frecuencia" value={(s.metrics?.averageRatePerMin ?? 0).toFixed(0)} color="#0F172A" icon={Timer} />
                                </div>

                                {/* Visual Telemetry (Simulated Rhythm) */}
                                <div style={{ height: 60, background: '#F8FAFC', borderRadius: 16, overflow: 'hidden', position: 'relative', border: '1px solid #F1F5F9' }}>
                                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, background: 'linear-gradient(90deg, transparent 95%, #1800AD 100%)', backgroundSize: '40px 100%' }} />
                                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(24, 0, 173, 0.1)' }} />
                                    
                                    {/* Simulated Pulse wave */}
                                    <svg width="100%" height="100%" viewBox="0 0 400 60" style={{ position: 'absolute' }}>
                                        <path d="M0 30 L40 30 L45 20 L55 40 L60 30 L100 30 L105 10 L115 50 L120 30 L160 30 L165 25 L175 35 L180 30 L220 30 L225 5 L235 55 L240 30 L280 30 L285 20 L295 40 L300 30 L340 30 L345 10 L355 50 L360 30 L400 30" 
                                              fill="none" stroke="#1800AD" strokeWidth="2" strokeOpacity="0.8" 
                                              style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'dash 10s linear infinite' }} />
                                    </svg>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 12 }}>
                                        <HeartPulse size={14} />
                                        <span>Rincitmo: AHA 2025 Compliant</span>
                                    </div>
                                    <button style={{ background: '#EEF0FF', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#1800AD', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        Intervenir <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes dash { to { stroke-dashoffset: 0; } }
                @keyframes ping {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

function MetricBox({ label, value, color, icon: Icon }: any) {
    return (
        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '16px 12px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#94A3B8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                <Icon size={12} /> {label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: color }}>{value}</div>
        </div>
    );
}
