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
            padding: '60px 24px', textAlign: 'center',
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#F0F1FA', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, fontSize: 24,
            }}>○</div>
            <h3 style={{
                fontSize: 16, fontWeight: 600,
                color: '#0B1C30', margin: '0 0 8px',
            }}>
                {title}
            </h3>
            {description && (
                <p style={{
                    fontSize: 14, color: '#8892A4',
                    margin: '0 0 16px', maxWidth: 320,
                }}>
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
