'use client';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { AHA_MIN_DEPTH_MM, AHA_MAX_DEPTH_MM } from '@/lib/constants';

interface DataPoint {
    t: number;       // seconds from start
    depth: number;   // mm
    rate?: number;   // cpm
}

interface CompressionChartProps {
    data: DataPoint[];
    height?: number;
}

export function CompressionChart({ data, height = 200 }: CompressionChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                    dataKey="t"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${v}s`}
                />
                <YAxis
                    yAxisId="depth"
                    domain={[30, 80]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${v}mm`}
                />
                <Tooltip
                    contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                    }}
                    formatter={(value) => [`${Number(value)} mm`, 'Profundidad']}
                    labelFormatter={(l) => `t=${l}s`}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />

                {/* AHA reference lines */}
                <ReferenceLine yAxisId="depth" y={AHA_MIN_DEPTH_MM} stroke="#FFAB00" strokeDasharray="4 2" label={{ value: '50mm', fill: '#FFAB00', fontSize: 10 }} />
                <ReferenceLine yAxisId="depth" y={AHA_MAX_DEPTH_MM} stroke="#FFAB00" strokeDasharray="4 2" label={{ value: '60mm', fill: '#FFAB00', fontSize: 10 }} />

                <Line
                    yAxisId="depth"
                    type="monotone"
                    dataKey="depth"
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={false}
                    name="depth"
                    isAnimationActive={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}