'use client';

import toast from 'react-hot-toast';
import { AuditService } from '@/features/audit/services/audit.service';

export interface AppErrorContext {
    source: string;
    resource?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    showToast?: boolean;
}

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string') return error;
    return fallback;
}

export function handleAppError(error: unknown, context: AppErrorContext): string {
    const message = getErrorMessage(error);
    console.error(`[${context.source}]`, error);

    AuditService.record({
        action: 'system.error',
        resource: context.resource || context.source,
        resourceId: context.resourceId,
        metadata: {
            message,
            ...(context.metadata || {}),
        },
        severity: 'warning',
    });

    if (context.showToast !== false) {
        toast.error(message);
    }

    return message;
}
