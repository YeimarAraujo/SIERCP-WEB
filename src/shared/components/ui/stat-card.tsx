interface StatCardProps {
    label: string;
    value: string | number;
    color?: string;
}

export function StatCard({ label, value, color = '#1800AD' }: StatCardProps) {
    return (
        <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E4F0',
            borderRadius: 12,
            padding: '20px 24px',
        }}>
            <p style={{ fontSize: 13, color: '#8892A4', margin: '0 0 8px' }}>
                {label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 600, color, margin: 0 }}>
                {value}
            </p>
        </div>
    );
}
