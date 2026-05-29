'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  subscribeLiveSessions,
  subscribeTelemetry,
  type LiveSessionEntry,
  type LiveTelemetry,
  type TelemetryPoint,
} from '@/shared/lib/rtdb-telemetry';
import { CourseService } from '@/services/firestore.service';
import { useAuth } from '@/hooks/use-auth';
import type { CourseModel } from '@/models/course';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import {
  Monitor, Users, Activity, Bluetooth, BluetoothOff,
  Gauge, Zap, Timer, ShieldCheck, HeartPulse, WifiOff,
} from 'lucide-react';

// ── Constantes AHA 2025 ───────────────────────────────────────────────────────
const AHA_MIN_DEPTH = 50;
const AHA_MAX_DEPTH = 60;
const AHA_MIN_RATE  = 100;
const AHA_MAX_RATE  = 120;
const MAX_HISTORY   = 40;

// ── Helpers de color ──────────────────────────────────────────────────────────
function depthColor(mm: number): string {
  if (mm >= AHA_MIN_DEPTH && mm <= AHA_MAX_DEPTH) return '#10B981';
  return '#EF4444';
}
function rateColor(cpm: number): string {
  if (cpm >= AHA_MIN_RATE && cpm <= AHA_MAX_RATE) return '#10B981';
  return '#EF4444';
}
function scoreColor(s: number): string {
  if (s >= 85) return '#10B981';
  if (s >= 70) return '#F59E0B';
  return '#EF4444';
}

// ── Componente: gráfica de profundidad ────────────────────────────────────────
function DepthChart({ history }: { history: TelemetryPoint[] }) {
  if (history.length < 2) {
    return (
      <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity size={18} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
      </div>
    );
  }

  const last = history[history.length - 1];
  const color = depthColor(last.depth);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          PROFUNDIDAD (mm)
        </span>
        <span style={{ fontSize: 11, fontWeight: 900, color }}>
          {last.depth.toFixed(1)} mm
        </span>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 80]} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} tickCount={5} />
          {/* Zona AHA correcta */}
          <ReferenceArea y1={AHA_MIN_DEPTH} y2={AHA_MAX_DEPTH} fill="#10B981" fillOpacity={0.08} />
          <ReferenceLine y={AHA_MIN_DEPTH} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.6} />
          <ReferenceLine y={AHA_MAX_DEPTH} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.6} />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
            formatter={(v: number) => [`${v.toFixed(1)} mm`, 'Profundidad']}
            labelFormatter={() => ''}
          />
          <Line
            type="monotone"
            dataKey="depth"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Componente: gráfica de frecuencia ─────────────────────────────────────────
function RateChart({ history }: { history: TelemetryPoint[] }) {
  if (history.length < 2) return null;

  const last = history[history.length - 1];
  const color = rateColor(last.rate);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          FRECUENCIA (cpm)
        </span>
        <span style={{ fontSize: 11, fontWeight: 900, color }}>
          {last.rate.toFixed(0)}/min
        </span>
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="t" hide />
          <YAxis domain={[60, 160]} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} tickCount={4} />
          <ReferenceArea y1={AHA_MIN_RATE} y2={AHA_MAX_RATE} fill="#10B981" fillOpacity={0.08} />
          <ReferenceLine y={AHA_MIN_RATE} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.6} />
          <ReferenceLine y={AHA_MAX_RATE} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.6} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Componente: card de sesión en vivo ────────────────────────────────────────
function LiveSessionCard({ session }: { session: LiveSessionEntry }) {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const historyRef = useRef<TelemetryPoint[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!session.sessionId) return;
    const unsub = subscribeTelemetry(session.sessionId, (data) => {
      setTelemetry(data);

      // Acumular historial rolling (hasta MAX_HISTORY puntos)
      if (data.compressionCount > 0 || data.depthMm > 0) {
        const point: TelemetryPoint = {
          t:       tickRef.current++,
          depth:   data.depthMm,
          rate:    data.ratePerMin,
          quality: data.correctPct,
        };
        const next = [...historyRef.current, point];
        if (next.length > MAX_HISTORY) next.shift();
        historyRef.current = next;
        setHistory([...next]);
      }
    });
    return unsub;
  }, [session.id]);

  const hasLive = (telemetry?.compressionCount ?? 0) > 0 || (telemetry?.depthMm ?? 0) > 0;
  const sColor  = scoreColor(telemetry?.sessionScore ?? 0);
  const dColor  = depthColor(telemetry?.depthMm ?? 0);
  const rColor  = rateColor(telemetry?.ratePerMin ?? 0);

  return (
    <div style={{
      background: 'var(--card)',
      border: `1.5px solid ${hasLive ? 'rgba(24,0,173,0.25)' : 'var(--border)'}`,
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: hasLive ? '0 4px 24px rgba(24,0,173,0.07)' : '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: hasLive ? 'rgba(24,0,173,0.03)' : 'transparent',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: hasLive ? 'rgba(24,0,173,0.08)' : 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: hasLive ? 'var(--brand)' : 'var(--text-muted)',
            fontWeight: 900, fontSize: 16,
          }}>
            {session.studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14 }}>
              {session.studentName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {session.scenarioTitle || 'Sin escenario'}
            </div>
          </div>
        </div>

        {/* Badge estado */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 10, fontSize: 10, fontWeight: 900,
          background: hasLive ? '#ECFDF5' : 'var(--muted)',
          color: hasLive ? '#10B981' : 'var(--text-muted)',
          border: `1px solid ${hasLive ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
        }}>
          {hasLive ? (
            <>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'live-pulse 1.5s infinite' }} />
              EN VIVO
            </>
          ) : (
            <>
              <WifiOff size={10} />
              ESPERANDO
            </>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Métricas principales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <MetricCell
            label="CALIDAD"
            value={`${(telemetry?.sessionScore ?? 0).toFixed(0)}`}
            unit="%"
            color={sColor}
            icon={<ShieldCheck size={12} />}
          />
          <MetricCell
            label="PROFUND."
            value={(telemetry?.depthMm ?? 0).toFixed(1)}
            unit="mm"
            color={dColor}
            icon={<Gauge size={12} />}
          />
          <MetricCell
            label="FREC."
            value={`${telemetry?.ratePerMin ?? 0}`}
            unit="/min"
            color={rColor}
            icon={<Timer size={12} />}
          />
        </div>

        {/* Compresiones + recoil */}
        {hasLive && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip label={`${telemetry?.compressionCount ?? 0} compres.`} color="var(--brand)" />
            <Chip label={`${(telemetry?.correctPct ?? 0).toFixed(0)}% correcto`} color={sColor} />
            {(telemetry?.pauseCount ?? 0) > 0 && (
              <Chip label={`${telemetry!.pauseCount} pausas`} color="#F59E0B" />
            )}
          </div>
        )}

        {/* Gráfica de profundidad */}
        <DepthChart history={history} />

        {/* Gráfica de frecuencia */}
        {history.length >= 5 && <RateChart history={history} />}

        {/* Estado dispositivo BLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {telemetry?.sensorOk !== false ? (
            <Bluetooth size={12} style={{ color: 'var(--brand)' }} />
          ) : (
            <BluetoothOff size={12} style={{ color: '#EF4444' }} />
          )}
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {session.manikinId
              ? `Maniquí: ${session.manikinId.length > 12 ? session.manikinId.slice(0, 12) + '…' : session.manikinId}`
              : 'Sin maniquí vinculado'}
          </span>
          {telemetry?.calibrated && (
            <span style={{ fontSize: 9, color: '#10B981', fontWeight: 700, marginLeft: 4 }}>✓ CALIBRADO</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers UI ────────────────────────────────────────────────────────────────
function MetricCell({ label, value, unit, color, icon }: {
  label: string; value: string; unit: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--muted)', borderRadius: 12, padding: '10px 8px',
      textAlign: 'center', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{unit}</div>
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color,
      background: `${color}18`,
      border: `1px solid ${color}35`,
      borderRadius: 6, padding: '2px 8px',
    }}>
      {label}
    </span>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function InstructorMonitorPage() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<LiveSessionEntry[]>([]);
  const [loading, setLoading]               = useState(true);
  const unsubsRef  = useRef<(() => void)[]>([]);
  const sessionMap = useRef(new Map<string, LiveSessionEntry>());

  const rebuildSessions = useCallback(() => {
    setActiveSessions([...sessionMap.current.values()]);
  }, []);

  const subscribeToSessions = useCallback((courses: CourseModel[]) => {
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
    sessionMap.current.clear();

    if (courses.length === 0) { setLoading(false); return; }

    courses.forEach(course => {
      const institutionId = (course as any).institutionId as string | undefined;
      if (!institutionId) return;

      const unsub = subscribeLiveSessions(institutionId, course.id, (entries) => {
        // Limpiar sesiones anteriores de este curso
        [...sessionMap.current.entries()].forEach(([sid, e]) => {
          if (e.courseId === course.id) sessionMap.current.delete(sid);
        });
        entries.forEach(e => { if (e.sessionId) sessionMap.current.set(e.sessionId, e); });
        rebuildSessions();
        setLoading(false);
      });

      unsubsRef.current.push(unsub);
    });

    const hasInst = courses.some(c => !!(c as any).institutionId);
    if (!hasInst) setLoading(false);
  }, [rebuildSessions]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    CourseService.getByInstructor(user.uid).then(courses => {
      if (cancelled) return;
      subscribeToSessions(courses);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      unsubsRef.current.forEach(u => u());
      unsubsRef.current = [];
    };
  }, [user, subscribeToSessions]);

  const total = activeSessions.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
      <Header title="Monitor en Vivo" />
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        <PageHero
          title="Monitor de Sesiones"
          subtitle="Telemetría BLE en tiempo real — AHA 2025"
          parentTitle="Instructor"
          parentHref="/instructor/dashboard"
        />

        {/* Barra de estado */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <StatusBadge
            icon={<HeartPulse size={14} />}
            label={`${total} SESIÓN${total !== 1 ? 'ES' : ''} ACTIVA${total !== 1 ? 'S' : ''}`}
            alive={total > 0}
          />
          <StatusBadge
            icon={<Activity size={14} />}
            label="RTDB EN VIVO"
            alive
            dimmed
          />
        </div>

        {/* Contenido */}
        {loading && total === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px,1fr))', gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 380, background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px,1fr))', gap: 20 }}>
            {activeSessions.map(s => (
              <LiveSessionCard key={s.sessionId ?? s.studentId} session={s} />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

// ── Componentes auxiliares de la página ───────────────────────────────────────
function StatusBadge({ icon, label, alive, dimmed }: { icon: React.ReactNode; label: string; alive: boolean; dimmed?: boolean }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {alive && !dimmed && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
      )}
      <span style={{ color: alive ? (dimmed ? 'var(--brand)' : '#10B981') : 'var(--text-muted)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon} {label}
      </span>
    </div>
  );
}

function EmptyState() {
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
        <Monitor size={32} style={{ color: 'var(--border-strong)', opacity: 0.5 }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>
        Sin sesiones activas
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
        Cuando un estudiante inicie una práctica BLE con maniquí en tus cursos, aparecerá aquí con telemetría en tiempo real.
      </p>
    </div>
  );
}
