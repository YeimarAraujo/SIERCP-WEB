'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { handleAppError } from '@/shared/lib/error-handler';

export default function SuperAdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        handleAppError(error, {
            source: 'super-admin.error-boundary',
            resource: 'super-admin',
            metadata: { digest: error.digest },
            showToast: false,
        });
    }, [error]);

    return (
        <div style={{ minHeight: '70dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
            <div style={{
                maxWidth: 620,
                width: '100%',
                borderRadius: 28,
                padding: 28,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                textAlign: 'center',
            }}>
                <div style={{
                    width: 58,
                    height: 58,
                    borderRadius: 20,
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 18px',
                    color: '#b91c1c',
                    background: '#fee2e2',
                }}>
                    <AlertTriangle size={28} />
                </div>
                <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 24, fontWeight: 900 }}>No se pudo cargar el módulo</h1>
                <p style={{ color: 'var(--text-secondary)', margin: '10px 0 22px' }}>
                    El error fue registrado en auditoría. Puedes reintentar sin perder la sesión.
                </p>
                <button onClick={reset} className="btn-primary" style={{ margin: '0 auto' }}>
                    <RefreshCcw size={16} />
                    Reintentar
                </button>
            </div>
        </div>
    );
}
