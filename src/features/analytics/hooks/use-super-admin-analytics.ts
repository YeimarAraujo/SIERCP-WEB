'use client';

import { useEffect, useState } from 'react';
import {
    SuperAdminAnalyticsService,
    type SuperAdminAnalytics,
} from '@/features/analytics/services/super-admin-analytics.service';
import { AuditService } from '@/features/audit/services/audit.service';

export function useSuperAdminAnalytics() {
    const [data, setData] = useState<SuperAdminAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const analytics = await SuperAdminAnalyticsService.getDashboard();
            setData(analytics);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo cargar analytics';
            setError(message);
            AuditService.record({
                action: 'system.error',
                resource: 'super-admin.analytics',
                metadata: { message },
                severity: 'warning',
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    return { data, loading, error, refresh };
}
