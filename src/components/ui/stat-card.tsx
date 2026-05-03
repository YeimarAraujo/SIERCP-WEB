import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: string;
    variant?: 'default' | 'glass';
    trend?: { value: number; label: string };
}

export function StatCard({ label, value, icon: Icon, color = 'var(--brand)', variant = 'default', trend }: StatCardProps) {
    const glassStyle = variant === 'glass' ? {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: 'var(--shadow-md)',
    } : {};

    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            ...glassStyle,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                    {label}
                </p>
                {Icon && (
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--brand-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Icon size={18} color={color} />
                    </div>
                )}
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                {value}
            </p>
            {trend && (
                <p style={{ fontSize: 12, color: trend.value >= 0 ? 'var(--success-text)' : 'var(--danger-text)', margin: '8px 0 0' }}>
                    {trend.value >= 0 ? '\u2191' : '\u2193'} {Math.abs(trend.value)}% {trend.label}
                </p>
            )}
        </div>
    );
}