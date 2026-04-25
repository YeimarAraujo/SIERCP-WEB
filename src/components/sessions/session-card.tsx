'use client';

import { formatDate, formatDuration, getScoreColor, getScoreLabel } from '@/lib/utils';
import { isApproved, isExcellent } from '@/lib/scoring';
import type { SessionModel } from '@/models/session';

interface SessionCardProps {
    session: SessionModel;
    onClick?: () => void;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
    const { status, metrics, startedAt, endedAt, duration, patientType } = session;
    const score = metrics?.score ?? 0;
    const label = getScoreLabel(score);
    const color = getScoreColor(score);

    return (
        <div
            onClick={onClick}
            className="p-4 rounded-lg border bg-card text-card-foreground cursor-pointer hover:bg-accent/50 transition-colors"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="font-medium capitalize">{patientType}</p>
                    <p className="text-sm text-muted-foreground">
                        {formatDate(startedAt)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold" style={{ color }}>
                        {score}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
            {metrics && (
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <div>
                        <p className="font-medium">{metrics.averageDepthMm}mm</p>
                        <p>Profundidad</p>
                    </div>
                    <div>
                        <p className="font-medium">{metrics.averageRatePerMin}/min</p>
                        <p>Ritmo</p>
                    </div>
                    <div>
                        <p className="font-medium">{formatDuration(duration)}</p>
                        <p>Duración</p>
                    </div>
                </div>
            )}
        </div>
    );
}