interface EmptyStateProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '60px 24px', textAlign: 'center' as const,
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--brand-light)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, fontSize: 24,
                color: 'var(--brand)',
            }}>○</div>
            <h3 style={{
                fontSize: 16, fontWeight: 600,
                color: 'var(--text-primary)', margin: '0 0 8px',
            }}>
                {title}
            </h3>
            {description && (
                <p style={{
                    fontSize: 14, color: 'var(--text-muted)',
                    margin: '0 0 16px', maxWidth: 320,
                }}>
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
