'use client';

import { useEffect } from 'react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => { console.error(error); }, [error]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', gap: 16, textAlign: 'center', padding: 32,
        }}>
            <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Error en el módulo de Administración</h2>
            <p style={{ color: '#64748B', fontSize: 14, margin: 0, maxWidth: 400 }}>
                Ocurrió un error inesperado. Intenta de nuevo o contacta al administrador.
            </p>
            <button onClick={reset} style={{
                padding: '10px 24px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF',
                border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>
                Reintentar
            </button>
        </div>
    );
}
