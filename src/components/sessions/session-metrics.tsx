'use client';

import { MetricBar } from '@/components/charts/metric-bar';
import { ScoreGauge } from '@/components/charts/score-gauge';
import { formatDuration } from '@/lib/utils';
import { AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM, AHA_MIN_RATE, AHA_MAX_RATE } from '@/lib/constants';
import type { SessionMetrics } from '@/models/session';

interface SessionMetricsProps {
    metrics: SessionMetrics;
    duration?: number;
}

function inRange(val: number, min: number, max: number) {
    return val >= min && val <= max;
}

export function SessionMetricsPanel({ metrics, duration }: SessionMetricsProps) {
    const depthOk = inRange(metrics.averageDepthMm, AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM);
    const rateOk = inRange(metrics.averageRatePerMin, AHA_MIN_RATE, AHA_MAX_RATE);

    return (
        <div className="space-y-6">
            {/* Score + summary row */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreGauge score={metrics.score} />
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm flex-1">
                    {[
                        { label: 'Comprensiones totales', value: metrics.totalCompressions, unit: '' },
                        { label: 'Comprensiones correctas', value: `${metrics.correctCompressionsPct}`, unit: '%' },
                        { label: 'Profundidad promedio', value: metrics.averageDepthMm.toFixed(1), unit: ' mm', ok: depthOk },
                        { label: 'Frecuencia promedio', value: metrics.averageRatePerMin.toFixed(0), unit: ' /min', ok: rateOk },
                        { label: 'Recoil', value: metrics.recoilPct.toFixed(0), unit: '%' },
                        { label: 'CCF', value: metrics.ccfPct.toFixed(0), unit: '%' },
                        { label: 'Interrupciones', value: metrics.interruptionCount, unit: '' },
                        { label: 'Pausa máxima', value: metrics.maxPauseSeconds.toFixed(1), unit: ' s' },
                        ...(duration ? [{ label: 'Duración', value: formatDuration(duration), unit: '' }] : []),
                    ].map(({ label, value, unit, ok }) => (
                        <div key={label}>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={`font-semibold tabular-nums ${ok === false ? 'text-aha-fail' : ok === true ? 'text-aha-excellent' : ''}`}>
                                {value}{unit}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Score breakdown bars */}
            <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desglose AHA</p>
                <MetricBar label="Profundidad (30%)" value={metrics.depthScore} max={30} unit=" pts" />
                <MetricBar label="Frecuencia (30%)" value={metrics.rateScore} max={30} unit=" pts" />
                <MetricBar label="Recoil (20%)" value={metrics.recoilScore} max={20} unit=" pts" />
                <MetricBar label="Interrupciones (20%)" value={metrics.interruptionScore} max={20} unit=" pts" />
            </div>

            {/* Violations */}
            {metrics.violations.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Violaciones detectadas</p>
                    {metrics.violations.map((v, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm">
                            <span className="text-destructive">{v.message}</span>
                            <span className="text-xs font-medium text-destructive">{v.count}×</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}