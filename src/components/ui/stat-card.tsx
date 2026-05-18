interface StatCardProps {
    label: string;
    value: string | number;
    color?: string;
}

export function StatCard({ label, value, color = 'var(--brand)' }: StatCardProps) {
    return (
        <div className="surface-glass lighting-border" style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
        }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                {label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 600, color, margin: 0 }}>
                {value}
            </p>
        </div>
    );
}
