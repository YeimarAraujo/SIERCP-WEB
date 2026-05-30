'use client';

/**
 * /admin/live — Monitor de sesiones en vivo para administradores.
 * Muestra TODAS las sesiones activas de la institución (todos los cursos)
 * vía RTDB: live_sessions/{institutionId}.
 */

import { useEffect, useRef, useState } from 'react';
import {
    subscribeAllLiveSessions,
    type LiveSessionEntry,
} from '@/shared/lib/rtdb-telemetry';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { LiveSessionsGrid } from '@/components/live/live-sessions-grid';
import { Building2 } from 'lucide-react';

export default function AdminLivePage() {
    const { user, loading: authLoading } = useAuth();
    const [sessions, setSessions] = useState<LiveSessionEntry[]>([]);
    const [loading, setLoading]   = useState(true);
    const unsubRef                = useRef<(() => void) | null>(null);

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        unsubRef.current?.();
        unsubRef.current = subscribeAllLiveSessions(institutionId, (entries) => {
            setSessions(entries);
            setLoading(false);
        });

        return () => {
            unsubRef.current?.();
            unsubRef.current = null;
        };
    }, [institutionId, authLoading]);

    const total = sessions.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Sesiones en Vivo" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <PageHero
                    title="Sesiones en Vivo"
                    subtitle="Telemetría BLE en tiempo real de toda la institución · AHA 2025"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                />

                {/* Barra de estado */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        {total > 0 && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: total > 0 ? '#10B981' : 'var(--text-muted)' }}>
                            {total} SESIÓN{total !== 1 ? 'ES' : ''} ACTIVA{total !== 1 ? 'S' : ''}
                        </span>
                    </div>
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: 'var(--brand)', fontSize: 12, fontWeight: 700,
                    }}>
                        <Building2 size={13} /> Toda la institución
                    </div>
                </div>

                <LiveSessionsGrid
                    sessions={sessions}
                    loading={loading}
                    emptyMessage="Cuando un estudiante de cualquier curso de la institución inicie una práctica BLE, aparecerá aquí en tiempo real."
                />
            </div>
        </div>
    );
}
