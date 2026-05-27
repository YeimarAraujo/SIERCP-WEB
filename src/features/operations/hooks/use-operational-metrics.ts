'use client';

import { useEffect, useState } from 'react';
import {
    OperationalMetricsService,
    type OperationalMetrics,
} from '@/features/operations/services/operational-metrics.service';

export function useOperationalMetrics(institutionId?: string | null) {
    const [data, setData] = useState<OperationalMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const metrics = await OperationalMetricsService.getMetrics(institutionId ?? undefined);
            setData(metrics);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cargar el estado operacional');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [institutionId]);

    return {
        data,
        loading,
        error,
        refresh,
    };
}
