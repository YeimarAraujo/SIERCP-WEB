'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { SessionMetricsPanel } from '@/components/sessions/session-metrics';
import { CompressionChart } from '@/components/charts/compression-chart';
import { SessionService } from '@/services/firestore.service';
import { formatDate, formatDuration } from '@/lib/utils';
import type { SessionModel } from '@/models/session';

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<SessionModel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        SessionService.get(id).then(setSession).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Sesión no encontrada.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Detalle de sesión" />
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-3xl mx-auto w-full">

                {/* Session info */}
                <div className="rounded-lg border border-border bg-card p-5 space-y-1">
                    <h2 className="font-semibold">{session.scenarioTitle ?? 'Sesión RCP'}</h2>
                    <p className="text-sm text-muted-foreground">{session.studentName}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                        <span>Inicio: {formatDate(session.startedAt)}</span>
                        {session.duration > 0 && <span>Duración: {formatDuration(session.duration)}</span>}
                        <span className="capitalize">Paciente: {session.patientType}</span>
                    </div>
                </div>

                {/* Metrics */}
                {session.metrics ? (
                    <div className="rounded-lg border border-border bg-card p-5">
                        <p className="text-sm font-semibold mb-4">Métricas AHA</p>
                        <SessionMetricsPanel metrics={session.metrics} duration={session.duration} />
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            {session.status === 'active' ? 'Sesión en curso — métricas disponibles al finalizar.' : 'Sin métricas registradas.'}
                        </p>
                    </div>
                )}

                {/* Chart placeholder — real data comes from sessions/{id}/compressions subcollection */}
                <div className="rounded-lg border border-border bg-card p-5">
                    <p className="text-sm font-semibold mb-3">Señal de compresiones</p>
                    <CompressionChart data={[]} height={180} />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Conecta datos de la subcolección compressions para ver la señal.
                    </p>
                </div>

            </div>
        </div>
    );
}