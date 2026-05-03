'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import { ESP32_DEVICE_PLACEHOLDER, type ESP32Device, type SIERCPEvaluation } from '@/lib/dashboard-data';

interface DashboardData {
    sessions: SessionModel[];
    evaluations: SIERCPEvaluation[];
    device: null;
    stats: {
        totalSessions: number;
        averageScore: number;
        bestScore: number;
        averageDepthMm: number;
        ahaCompliance: number;
    };
    loading: boolean;
    error: string | null;
    hasAnyActivity: boolean;
    refresh: () => void;
}

export function useDashboardData(): DashboardData {
    const user = useAuthStore((s) => s.user);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        setError(null);
        try {
            const data = await SessionService.getByStudent(user.uid, 20);
            setSessions(data);
        } catch (e) {
            console.error('Error fetching sessions:', e);
            setError('Error al cargar datos de sesiones');
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Derived metrics with safe optional chaining
    const totalSessions = user?.stats?.totalSessions ?? sessions.length;
    const averageScore = user?.stats?.averageScore
        ?? (sessions.length > 0
            ? Math.round(sessions.reduce((acc, s) => acc + (s.metrics?.score ?? 0), 0) / sessions.length)
            : 0);
    const bestScore = user?.stats?.bestScore ?? 0;
    const averageDepthMm = user?.stats?.averageDepthMm
        ?? (sessions.length > 0
            ? Math.round(sessions.reduce((acc, s) => acc + (s.metrics?.averageDepthMm ?? 0), 0) / sessions.length)
            : 0);
    const ahaCompliance = ESP32_DEVICE_PLACEHOLDER.ahaComplianceScore;

    // Transform sessions to evaluation list format
    const evaluations: SIERCPEvaluation[] = sessions.slice(0, 5).map((s) => ({
        id: s.id,
        studentName: (user?.firstName ?? '') + ' ' + (user?.lastName ?? '') || 'Usuario',
        studentInitials: (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '') || 'U',
        date: s.startedAt ? new Date(s.startedAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : '—',
        score: s.metrics?.score ?? 0,
        status: (s.metrics?.score ?? 0) >= 85 ? 'approve' as const : 'retake' as const,
        courseName: s.scenarioTitle ?? '',
    }));

    return {
        sessions,
        evaluations,
        device: null,
        stats: { totalSessions, averageScore, bestScore, averageDepthMm, ahaCompliance },
        loading,
        error,
        hasAnyActivity: sessions.length > 0,
        refresh: fetchData,
    };
}
