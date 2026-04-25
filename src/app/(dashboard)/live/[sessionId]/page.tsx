'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MetricBar } from '@/components/charts/metric-bar';
import { CompressionChart } from '@/components/charts/compression-chart';
import { RoleGuard } from '@/components/layout/role-guard';
import { SessionService } from '@/services/firestore.service';
import { useDeviceTelemetry } from '@/hooks/use-realtime';
import { formatDuration } from '@/lib/utils';
import { AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM, AHA_MIN_RATE, AHA_MAX_RATE } from '@/lib/constants';
import type { SessionModel } from '@/models/session';

interface ChartPoint { t: number; depth: number; }

export default function LiveSessionPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [session, setSession] = useState<SessionModel | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);

    // Get the manikin MAC from session to subscribe telemetry
    const telemetry = useDeviceTelemetry(session?.manikinId ?? null);

    // Load session
    useEffect(() => {
        SessionService.get(sessionId).then(setSession);
    }, [sessionId]);

    // Elapsed timer
    useEffect(() => {
        if (!session?.startedAt || session.status !== 'active') return;
        const interval = setInterval(() => {
            setElapsed(Math.round((Date.now() - session.startedAt.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [session]);

    // Push telemetry points to chart
    useEffect(() => {
        if (!telemetry?.enCompresion) return;
        setChartData((prev) => {
            const point = { t: elapsed, depth: telemetry.profundidadMm };
            const next = [...prev, point];
            return next.length > 120 ? next.slice(-120) : next; // keep last 120 points
        });
    }, [telemetry?.profundidadMm, elapsed]); // eslint-disable-line react-hooks/exhaustive-deps

    const depthOk = telemetry
        ? telemetry.profundidadMm >= AHA_MIN_DEPTH_MM && telemetry.profundidadMm <= AHA_MAX_DEPTH_MM
        : null;
    const rateOk = telemetry
        ? telemetry.frecuenciaCpm >= AHA_MIN_RATE && telemetry.frecuenciaCpm <= AHA_MAX_RATE
        : null;

    return (
        <RoleGuard allowedRoles={['ADMIN', 'INSTRUCTOR']}>
            <div className="flex flex-col h-full">
                <Header title="Vista en vivo — Instructor" />
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">

                    {/* Session info + timer */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4">
                        <div>
                            <p className="font-semibold">{session?.scenarioTitle ?? 'Sesión en curso'}</p>
                            <p className="text-sm text-muted-foreground">{session?.studentName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold tabular-nums font-mono">{formatDuration(elapsed)}</p>
                            <p className="text-xs text-muted-foreground">
                                {telemetry?.isActive
                                    ? <span className="text-green-600">● Dispositivo activo</span>
                                    : <span className="text-red-500">● Sin señal</span>}
                            </p>
                        </div>
                    </div>

                    {/* Live metric tiles */}
                    {telemetry && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Profundidad', value: `${telemetry.profundidadMm.toFixed(1)} mm`, ok: depthOk },
                                { label: 'Frecuencia', value: `${telemetry.frecuenciaCpm.toFixed(0)} /min`, ok: rateOk },
                                { label: 'Compresiones', value: String(telemetry.compresiones), ok: null },
                                { label: 'Recoil', value: telemetry.recoilOk ? 'OK' : 'Incompleto', ok: telemetry.recoilOk },
                            ].map(({ label, value, ok }) => (
                                <div key={label} className={`rounded-lg border p-4 transition-colors ${ok === true ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : ok === false ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : 'border-border bg-card'}`}>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className={`text-xl font-bold tabular-nums mt-1 ${ok === true ? 'text-green-600' : ok === false ? 'text-red-500' : ''}`}>{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quality bars */}
                    {telemetry && (
                        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                            <p className="text-sm font-semibold">Calidad en tiempo real</p>
                            <MetricBar label="Calidad general" value={telemetry.calidadPct} />
                            <MetricBar label="Recoil" value={telemetry.recoilPct} />
                        </div>
                    )}

                    {/* Live chart */}
                    <div className="rounded-lg border border-border bg-card p-5">
                        <p className="text-sm font-semibold mb-3">Señal de profundidad en vivo</p>
                        <CompressionChart data={chartData} height={200} />
                    </div>

                    {!telemetry && (
                        <div className="rounded-lg border border-dashed border-border p-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                Esperando señal del maniquí ESP-32...
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </RoleGuard>
    );
}