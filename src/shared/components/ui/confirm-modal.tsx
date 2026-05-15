'use client';

import { AlertTriangle, Zap, Info } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const variantIcons = {
    danger: AlertTriangle,
    warning: Zap,
    info: Info,
};

const variantColors = {
    danger: {
        bg: 'var(--danger-bg)',
        text: 'var(--danger-text)',
        btn: '#DC2626',
    },
    warning: {
        bg: 'var(--warning-bg)',
        text: 'var(--warning-text)',
        btn: '#D97706',
    },
    info: {
        bg: 'var(--info-bg)',
        text: 'var(--info-text)',
        btn: 'var(--brand)',
    },
};

export function ConfirmModal({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const colors = variantColors[variant];
    const VariantIcon = variantIcons[variant];

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(6, 11, 46, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '32px',
                    maxWidth: '420px',
                    width: '90%',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    background: colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                }}>
                    <VariantIcon size={24} color={colors.text} />
                </div>

                <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0 0 8px',
                }}>
                    {title}
                </h3>

                <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    margin: '0 0 24px',
                    lineHeight: '1.6',
                }}>
                    {description}
                </p>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="btn-ghost"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            background: colors.btn,
                            color: 'var(--text-on-brand)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        {loading ? '...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
