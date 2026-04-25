'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { getScoreColor, getScoreLabel } from '@/lib/utils';

interface ScoreGaugeProps {
    score: number;
    size?: number;
}

export function ScoreGauge({ score, size = 140 }: ScoreGaugeProps) {
    const color = getScoreColor(score);
    const label = getScoreLabel(score);
    const data = [{ value: score, fill: color }];

    return (
        <div className="flex flex-col items-center gap-1">
            <div style={{ width: size, height: size }} className="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%" cy="50%"
                        innerRadius="70%" outerRadius="100%"
                        startAngle={90} endAngle={-270}
                        data={data}
                        barSize={10}
                    >
                        <RadialBar dataKey="value" cornerRadius={5} background={{ fill: 'hsl(var(--muted))' }} />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums" style={{ color }}>
                        {Math.round(score)}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                </div>
            </div>
            <span className="text-sm font-medium" style={{ color }}>{label}</span>
        </div>
    );
}