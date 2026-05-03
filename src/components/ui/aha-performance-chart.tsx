'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import type { ChartDataPoint } from '@/lib/dashboard-data';

interface FatiguePointInfo {
    index: number;
    time: string;
    label: string;
}

interface AhaPerformanceChartProps {
    data?: ChartDataPoint[] | null;
    fatiguePoint?: FatiguePointInfo | null;
    courseName?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}

function CustomTooltip({ active, payload, label, fatiguePoint }: CustomTooltipProps & { fatiguePoint?: FatiguePointInfo | null }) {
    if (!active || !payload?.length) return null;
    const isFatigue = label === fatiguePoint?.time || label === '2:30';

    return (
        <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-center shadow-lg z-30 min-w-[160px]">
            <div className="text-xs opacity-80">{label} min</div>
            <div className="font-bold text-sm">{payload[0].value} bpm</div>
            {isFatigue && fatiguePoint && (
                <div className="text-[11px] mt-1 opacity-90 font-medium">
                    {fatiguePoint.label}
                </div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
    );
}

interface CustomDotProps {
    cx?: number;
    cy?: number;
    index?: number;
}

function CustomDot({ cx, cy, index, fatiguePoint }: CustomDotProps & { fatiguePoint?: FatiguePointInfo | null }) {
    if (cx == null || cy == null) return null;
    const isFatigue = index === (fatiguePoint?.index ?? -1);

    if (!isFatigue) return null;

    return (
        <g>
            <line
                x1={cx}
                y1={cy + 8}
                x2={cx}
                y2={280}
                stroke="#EF4444"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                opacity={0.5}
            />
            <circle
                cx={cx}
                cy={cy}
                r={6}
                fill="#EF4444"
                stroke="#FFFFFF"
                strokeWidth={2}
            />
        </g>
    );
}

export function AhaPerformanceChart({ data, fatiguePoint, courseName }: AhaPerformanceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-slate-50 min-h-[350px] flex items-center justify-center">
                <EmptyState
                    title="Sin datos de rendimiento"
                    description="Realiza una sesión de entrenamiento para ver el gráfico de rendimiento AHA."
                />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-slate-50 min-h-[350px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                    Rendimiento del Curso{courseName ? `: ${courseName}` : ''}
                </h3>
            </div>

            <div className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="ahaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="#E2E8F0"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                            tickMargin={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                            tickMargin={8}
                            domain={[40, 120]}
                            ticks={[40, 60, 80, 100, 120]}
                        />
                        <Tooltip
                            content={<CustomTooltip fatiguePoint={fatiguePoint} />}
                            cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="bpm"
                            stroke="#10B981"
                            strokeWidth={2.5}
                            fill="url(#ahaGradient)"
                            dot={({ cx, cy, index }: CustomDotProps) => (
                                <CustomDot cx={cx} cy={cy} index={index} fatiguePoint={fatiguePoint} />
                            )}
                            activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-medium px-2 mt-2">
                {data.map((point, i) => (
                    <span
                        key={point.time}
                        className={i === (fatiguePoint?.index ?? -1) ? 'text-rose-600 font-bold' : ''}
                    >
                        {point.time}
                    </span>
                ))}
            </div>
        </div>
    );
}
