'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { SessionCard } from '@/components/sessions/session-card';
import { useAuth } from '@/hooks/use-auth';
import { SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';

export default function HistoryPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchFn = user.role === 'ESTUDIANTE'
            ? () => SessionService.getByStudent(user.uid, 50)
            : () => SessionService.getByStudent(user.uid, 50); // instructors see own; extend later
        fetchFn().then(setSessions).finally(() => setLoading(false));
    }, [user]);

    const approved = sessions.filter((s) => s.metrics?.approved).length;
    const avgScore = sessions.length
        ? sessions.reduce((acc, s) => acc + (s.metrics?.score ?? 0), 0) / sessions.length
        : 0;

    return (
        <div className="flex flex-col h-full">
            <Header title="Historial de sesiones" />
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                {/* Summary */}
                {!loading && sessions.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total sesiones', value: sessions.length },
                            { label: 'Aprobadas', value: approved },
                            { label: 'Puntaje promedio', value: avgScore.toFixed(1) },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg border border-border bg-card p-4 text-center">
                                <p className="text-2xl font-bold tabular-nums">{value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center">
                        <p className="text-sm text-muted-foreground">No hay sesiones en el historial.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
                    </div>
                )}
            </div>
        </div>
    );
}