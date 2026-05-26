'use client';

import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { formatCOP, type WompiTransactionStatus } from '@/services/wompi.service';

const STATUS_CONFIG: Record<WompiTransactionStatus, {
    icon: string; color: string; bg: string; title: string; message: string;
}> = {
    APPROVED: {
        icon: 'bi-check-circle-fill', color: '#22c55e', bg: 'rgba(34,197,94,0.08)',
        title: '¡Pago Exitoso!',
        message: 'Tu inscripción ha sido activada. Redirigiendo a tu panel de estudiante...',
    },
    PENDING: {
        icon: 'bi-clock-fill', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',
        title: 'Pago en Proceso',
        message: 'Tu banco está procesando el pago. Te notificaremos por correo cuando se confirme.',
    },
    DECLINED: {
        icon: 'bi-x-circle-fill', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',
        title: 'Pago Rechazado',
        message: 'El banco rechazó la transacción. Verifica tu saldo o intenta con otro método de pago.',
    },
    VOIDED: {
        icon: 'bi-slash-circle-fill', color: '#6b7280', bg: 'rgba(107,114,128,0.08)',
        title: 'Pago Anulado',
        message: 'La transacción fue anulada. Puedes intentar de nuevo cuando quieras.',
    },
    ERROR: {
        icon: 'bi-exclamation-triangle-fill', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',
        title: 'Error en el Pago',
        message: 'Ocurrió un error al procesar el pago. Por favor intenta de nuevo o contáctanos.',
    },
};

interface ResultadoModalProps {
    open: boolean;
    loading: boolean;
    status: WompiTransactionStatus | null;
    amount: number | null;
    reference: string | null;
    onClose?: () => void;
    onRetry?: () => void;
    onGoToCourses?: () => void;
}

export default function ResultadoModal({
    open, loading, status, amount, reference, onClose, onRetry, onGoToCourses,
}: ResultadoModalProps) {
    const [copied, setCopied] = useState(false);

    const canClose = !loading && status !== 'APPROVED';

    // Cerrar con Escape
    useEffect(() => {
        if (!open || !canClose) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, canClose, onClose]);

    // Bloquear scroll
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handleCopy = () => {
        if (!reference) return;
        navigator.clipboard.writeText(reference).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (!open) return null;

    const config = status ? STATUS_CONFIG[status] : null;

    return (
        <>
            {/* Backdrop — cierra al hacer clic fuera */}
            <div
                onClick={() => canClose && onClose?.()}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1050,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    cursor: canClose ? 'pointer' : 'default',
                }}
            />

            {/* Contenedor centrador — pointerEvents none para no bloquear backdrop */}
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 1051,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                    pointerEvents: 'none', // ← clave: pasa clics al backdrop
                }}
            >
                {/* Tarjeta del modal — restaura pointer events y detiene propagación */}
                <div
                    onClick={e => e.stopPropagation()}
                    className="animate__animated animate__fadeInUp animate__faster"
                    style={{
                        pointerEvents: 'all', // ← restaura para la tarjeta
                        background: 'var(--clr-bg-surface)',
                        borderRadius: 28,
                        padding: '2.5rem 2.5rem 2rem',
                        maxWidth: 500,
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.35)',
                        position: 'relative',
                    }}
                >
                    {/* Botón cerrar */}
                    {canClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            style={{
                                position: 'absolute', top: 16, right: 16,
                                background: 'var(--clr-bg-light, #f3f4f6)',
                                border: 'none', borderRadius: '50%',
                                width: 36, height: 36,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--clr-text-muted, #6b7280)',
                                fontSize: 16,
                                transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#e5e7eb';
                                e.currentTarget.style.color = '#111';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--clr-bg-light, #f3f4f6)';
                                e.currentTarget.style.color = 'var(--clr-text-muted, #6b7280)';
                            }}
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    )}

                    {/* ── Cargando ── */}
                    {loading ? (
                        <div className="py-3">
                            <Spinner
                                animation="border"
                                style={{ width: 72, height: 72, borderWidth: 5, color: 'var(--clr-primary)' }}
                            />
                            <h3 className="fw-bold mt-4 mb-2" style={{ color: 'var(--clr-text-head)' }}>
                                Verificando tu pago...
                            </h3>
                            <p className="text-muted mb-0">
                                Consultando la respuesta de tu banco. Por favor espera.
                            </p>
                        </div>

                    ) : config ? (
                        /* ── Resultado ── */
                        <>
                            {/* Ícono */}
                            <div
                                className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                    width: 100, height: 100,
                                    background: config.bg,
                                    border: `2.5px solid ${config.color}`,
                                    boxShadow: `0 0 0 10px ${config.bg}`,
                                }}
                            >
                                <i className={`bi ${config.icon}`} style={{ fontSize: 44, color: config.color }} />
                            </div>

                            <h2 className="fw-black mb-2" style={{ color: 'var(--clr-text-head)', letterSpacing: '-1px' }}>
                                {config.title}
                            </h2>

                            {amount != null && amount > 0 && (
                                <div
                                    className="d-inline-block px-4 py-2 rounded-pill fw-bold mb-3"
                                    style={{ background: config.bg, color: config.color, fontSize: '1.25rem' }}
                                >
                                    {formatCOP(amount)}
                                </div>
                            )}

                            <p className="text-muted mb-4" style={{ fontSize: '1rem', lineHeight: 1.65 }}>
                                {config.message}
                            </p>

                            {/* Referencia con botón copiar */}
                            {reference && (
                                <div
                                    className="mb-4 px-3 py-2 rounded-3 d-inline-flex align-items-center gap-2"
                                    style={{
                                        background: 'var(--clr-bg-light, #f9fafb)',
                                        border: '1px solid var(--clr-border, #e5e7eb)',
                                    }}
                                >
                                    <i className="bi bi-receipt text-muted" style={{ fontSize: 13 }} />
                                    <span className="text-muted small">Ref:</span>
                                    <code style={{ fontSize: '0.8rem', color: 'var(--clr-text-head)' }}>
                                        {reference}
                                    </code>
                                    <button
                                        type="button"
                                        title={copied ? 'Copiado' : 'Copiar referencia'}
                                        onClick={handleCopy}
                                        style={{
                                            background: 'none', border: 'none', padding: '0 2px',
                                            cursor: 'pointer',
                                            color: copied ? '#22c55e' : 'var(--clr-primary)',
                                            fontSize: 13,
                                            transition: 'color 0.2s',
                                        }}
                                    >
                                        <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} />
                                    </button>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="d-flex gap-2 justify-content-center flex-wrap mt-2">
                                {status === 'APPROVED' && (
                                    <button
                                        type="button"
                                        onClick={onGoToCourses}
                                        className="btn-brand px-5 py-3"
                                        style={{ borderRadius: 16, fontSize: '1rem' }}
                                    >
                                        <i className="bi bi-mortarboard-fill me-2" />
                                        Ir a mis cursos
                                    </button>
                                )}

                                {(status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') && (
                                    <button
                                        type="button"
                                        onClick={onRetry}
                                        className="btn-brand px-4 py-3"
                                        style={{ borderRadius: 16, fontSize: '1rem' }}
                                    >
                                        <i className="bi bi-arrow-counterclockwise me-2" />
                                        Intentar de nuevo
                                    </button>
                                )}

                                <a
                                    href="https://wa.me/573000000000"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-secondary px-4 py-3 rounded-3"
                                    style={{ fontSize: '1rem' }}
                                >
                                    <i className="bi bi-whatsapp me-2 text-success" />
                                    Soporte
                                </a>
                            </div>

                            {canClose && (
                                <p className="text-muted mt-4 mb-0" style={{ fontSize: '0.72rem' }}>
                                    Presiona <kbd>Esc</kbd> o haz clic fuera para cerrar
                                </p>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}