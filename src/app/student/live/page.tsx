'use client';

/**
 * /student/live — Monitor de sesiones en vivo para instructores con role=USUARIO.
 *
 * Usa Firebase Realtime Database (no Firestore) para evitar errores 403:
 *   live_sessions/{institutionId}/{courseId}/{sessionId}  → metadata de sesión
 *   telemetry/{sessionId}                                 → telemetría en tiempo real
 *
 * El RTDB ya tiene reglas permisivas para instructores autenticados.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CourseService } from '@/services/firestore.service';
import {
    subscribeLiveSessions,
    subscribeTelemetry,
    type LiveSessionEntry,
    type LiveTelemetry,
    type TelemetryPoint,
} from '@/shared/lib/rtdb-telemetry';
import { useAuth } from '@/hooks/use-auth';
import type { CourseModel } from '@/models/course';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    ReferenceLine, ReferenceArea, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
    Monitor, Bluetooth, BluetoothOff, ShieldCheck,
    Gauge, Timer, Activity, WifiOff, BookOpen,
} from 'lucide-react';

// ── Constantes AHA ────────────────────────────────────────────────────────────
const AHA_MIN_DEPTH = 50;
const AHA_MAX_DEPTH = 60;
const AHA_MIN_RATE  = 100;
const AHA_MAX_RATE  = 120;
const MAX_HIST      = 40;

function depthColor(mm: number)  { return mm >= AHA_MIN_DEPTH && mm <= AHA_MAX_DEPTH ? '#10B981' : '#EF4444'; }
function rateColor(cpm: number)  { return cpm >= AHA_MIN_RATE && cpm <= AHA_MAX_RATE ? '#10B981' : '#EF4444'; }
function scoreColor(s: number)   { return s >= 85 ? '#10B981' : s >= 70 ? '#F59E0B' : '#EF4444'; }

// ── Gráfica de profundidad ────────────────────────────────────────────────────
function DepthChart({ history }: { history: TelemetryPoint[] }) {
    if (history.length < 2) {
        return (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={16} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            </div>
        );
    }
    const last  = history[history.length - 1];
    const color = depthColor(last.depth);
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    PROFUNDIDAD (mm)
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color }}>{last.depth.toFixed(1)} mm</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
                <LineChart data={history} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[0, 80]} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} tickCount={4} />
                    <ReferenceArea y1={AHA_MIN_DEPTH} y2={AHA_MAX_DEPTH} fill="#10B981" fillOpacity={0.07} />
                    <ReferenceLine y={AHA_MIN_DEPTH} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={AHA_MAX_DEPTH} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Tooltip
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [`${v.toFixed(1)} mm`, 'Prof.']}
                        labelFormatter={() => ''}
                    />
                    <Line type="monotone" dataKey="depth" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ── Card de sesión en vivo ────────────────────────────────────────────────────
function LiveCard({ session }: { session: LiveSessionEntry }) {
    const [tele, setTele]   = useState<LiveTelemetry | null>(null);
    const [hist, setHist]   = useState<TelemetryPoint[]>([]);
    const histRef           = useRef<TelemetryPoint[]>([]);
    const tickRef           = useRef(0);

    useEffect(() => {
        if (!session.sessionId) return;
        const unsub = subscribeTelemetry(session.sessionId, (data) => {
            setTele(data);
            if (data.compressionCount > 0 || data.depthMm > 0) {
                const pt: TelemetryPoint = {
                    t:       tickRef.current++,
                    depth:   data.depthMm,
                    rate:    data.ratePerMin,
                    quality: data.correctPct,
                };
                const next = [...histRef.current, pt];
                if (next.length > MAX_HIST) next.shift();
                histRef.current = next;
                setHist([...next]);
            }
        });
        return unsub;
    }, [session.sessionId]);

    const hasLive = (tele?.compressionCount ?? 0) > 0 || (tele?.depthMm ?? 0) > 0;
    const sc = scoreColor(tele?.sessionScore ?? 0);
    const dc = depthColor(tele?.depthMm ?? 0);
    const rc = rateColor(tele?.ratePerMin ?? 0);

    return (
        <div style={{
            background: 'var(--card)',
            border: `1.5px solid ${hasLive ? 'rgba(24,0,173,0.25)' : 'var(--border)'}`,
            borderRadius: 18, overflow: 'hidden',
            boxShadow: hasLive ? '0 4px 20px rgba(24,0,173,0.07)' : '0 1px 4px rgba(0,0,0,0.04)',
        }}>
            {/* Header */}
            <div style={{
                padding: '13px 16px', borderBottom: '1px solid var(--border)',
                background: hasLive ? 'rgba(24,0,173,0.03)' : 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: hasLive ? 'rgba(24,0,173,0.08)' : 'var(--muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: hasLive ? 'var(--brand)' : 'var(--text-muted)',
                        fontWeight: 900, fontSize: 15,
                    }}>
                        {(session.studentName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 13 }}>
                            {session.studentName || 'Estudiante'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                            {session.scenarioTitle || 'Sin escenario'}
                        </div>
                    </div>
                </div>

                <span style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900,
                    background: hasLive ? '#ECFDF5' : 'var(--muted)',
                    color: hasLive ? '#10B981' : 'var(--text-muted)',
                    border: `1px solid ${hasLive ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                }}>
                    {hasLive
                        ? <><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'live-p 1.5s infinite' }} />EN VIVO</>
                        : <><WifiOff size={9} />ESPERANDO</>
                    }
                </span>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                        { label: 'CALIDAD',  value: `${(tele?.sessionScore ?? 0).toFixed(0)}%`,  color: sc, Icon: ShieldCheck },
                        { label: 'PROF.',    value: `${(tele?.depthMm ?? 0).toFixed(1)}mm`,       color: dc, Icon: Gauge },
                        { label: 'FREC.',    value: `${tele?.ratePerMin ?? 0}/min`,                color: rc, Icon: Timer },
                    ].map(({ label, value, color, Icon }) => (
                        <div key={label} style={{ background: 'var(--muted)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 8, fontWeight: 800, letterSpacing: '0.06em', marginBottom: 3 }}>
                                <Icon size={10} /> {label}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 900, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Gráfica de profundidad */}
                <DepthChart history={hist} />

                {/* BLE / maniquí */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {tele?.sensorOk !== false
                        ? <Bluetooth size={11} style={{ color: 'var(--brand)' }} />
                        : <BluetoothOff size={11} style={{ color: '#EF4444' }} />}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {session.manikinId
                            ? `Maniquí: ${session.manikinId.length > 12 ? session.manikinId.slice(0, 12) + '…' : session.manikinId}`
                            : 'Sin maniquí vinculado'}
                    </span>
                    {tele?.calibrated && (
                        <span style={{ fontSize: 9, color: '#10B981', fontWeight: 700, marginLeft: 4 }}>
                            ✓ CAL.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function StudentLivePage() {
    const { user }                      = useAuth();
    const [courses, setCourses]         = useState<CourseModel[]>([]);
    const [sessions, setSessions]       = useState<LiveSessionEntry[]>([]);
    const [loading, setLoading]         = useState(true);
    const unsubsRef                     = useRef<(() => void)[]>([]);

    // sessionId → LiveSessionEntry para deduplicar
    const sessionMap = useRef(new Map<string, LiveSessionEntry>());

    const rebuildSessions = useCallback(() => {
        setSessions([...sessionMap.current.values()]);
    }, []);

    const subscribeToRtdb = useCallback((loadedCourses: CourseModel[]) => {
        // Limpiar suscripciones anteriores
        unsubsRef.current.forEach(u => u());
        unsubsRef.current = [];
        sessionMap.current.clear();

        if (loadedCourses.length === 0) {
            setLoading(false);
            return;
        }

        // Por cada curso, suscribir a live_sessions/{institutionId}/{courseId}
        loadedCourses.forEach(course => {
            const institutionId = (course as any).institutionId as string | undefined;
            if (!institutionId) return;

            const unsub = subscribeLiveSessions(institutionId, course.id, (entries) => {
                // Quitar sesiones anteriores de este curso
                [...sessionMap.current.entries()].forEach(([sid, entry]) => {
                    if (entry.courseId === course.id) {
                        sessionMap.current.delete(sid);
                    }
                });
                // Agregar las activas
                entries.forEach(entry => {
                    if (entry.sessionId) {
                        sessionMap.current.set(entry.sessionId, entry);
                    }
                });
                rebuildSessions();
                setLoading(false);
            });

            unsubsRef.current.push(unsub);
        });

        // Si hay cursos pero ninguno tiene institutionId, marcar como cargado
        const hasAnyInstitution = loadedCourses.some(c => !!(c as any).institutionId);
        if (!hasAnyInstitution) setLoading(false);
    }, [rebuildSessions]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        CourseService.getByInstructor(user.uid)
            .then(data => {
                if (cancelled) return;
                setCourses(data);
                subscribeToRtdb(data);
            })
            .catch(() => { if (!cancelled) setLoading(false); });

        return () => {
            cancelled = true;
            unsubsRef.current.forEach(u => u());
            unsubsRef.current = [];
        };
    }, [user, subscribeToRtdb]);

    const total = sessions.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Sesiones en Vivo" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <PageHero
                    title="Sesiones en Vivo"
                    subtitle="Telemetría BLE en tiempo real de tus cursos · AHA 2025"
                    parentTitle="Mis cursos instructor"
                    parentHref="/student/instructor-courses"
                />

                {/* Barra de estado */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        {total > 0 && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: total > 0 ? '#10B981' : 'var(--text-muted)' }}>
                            {total} SESIÓN{total !== 1 ? 'ES' : ''} ACTIVA{total !== 1 ? 'S' : ''}
                        </span>
                    </div>
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: 'var(--brand)', fontSize: 12, fontWeight: 700,
                    }}>
                        <BookOpen size={13} /> {courses.length} curso{courses.length !== 1 ? 's' : ''} monitoreado{courses.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Contenido */}
                {loading && total === 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px,1fr))', gap: 16 }}>
                        {[1, 2].map(i => (
                            <div key={i} style={{ height: 320, background: 'var(--card)', borderRadius: 18, border: '1px solid var(--border)', animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : total === 0 ? (
                    <EmptyState courses={courses} />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px,1fr))', gap: 16 }}>
                        {sessions.map(s => (
                            <LiveCard key={s.sessionId ?? s.studentId} session={s} />
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes live-p {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.5; transform: scale(1.4); }
                }
            `}</style>
        </div>
    );
}

// ── Estado vacío ──────────────────────────────────────────────────────────────
function EmptyState({ courses }: { courses: CourseModel[] }) {
    return (
        <div style={{
            background: 'var(--card)', border: '1px dashed var(--border)',
            borderRadius: 24, padding: '80px 40px', textAlign: 'center',
        }}>
            <div style={{
                width: 72, height: 72, borderRadius: '50%', background: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
            }}>
                <Monitor size={32} style={{ color: 'var(--border-strong)', opacity: 0.4 }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>
                Sin sesiones activas
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
                {courses.length === 0
                    ? 'No tienes cursos asignados como instructor todavía.'
                    : `Monitoreando ${courses.length} curso${courses.length !== 1 ? 's' : ''}. Cuando un estudiante inicie una práctica BLE, aparecerá aquí en tiempo real.`
                }
            </p>
        </div>
    );
}
