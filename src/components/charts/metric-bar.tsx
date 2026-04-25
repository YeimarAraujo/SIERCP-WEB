'use client';

import { cn } from '@/lib/utils';

interface MetricBarProps {
    label: string;
    value: number;
    max?: number;
    unit?: string;
    color?: string;
    className?: string;
}

export function MetricBar({ label, value, max = 100, unit = '%', color, className }: MetricBarProps) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const barColor = color ?? (pct >= 85 ? '#00E676' : pct >= 70 ? '#FFAB00' : '#FF3B5C');

    return (
        <div className={cn('space-y-1', className)}>
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{value}{unit}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
            </div>
        </div>
    );
}