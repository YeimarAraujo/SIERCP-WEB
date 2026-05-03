interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border)',
        }}>
            <div>
                <h1 style={{
                    fontSize: 24, fontWeight: 600,
                    color: 'var(--text-primary)', margin: 0,
                }}>
                    {title}
                </h1>
                {subtitle && (
                    <p style={{
                        fontSize: 14, color: 'var(--text-muted)',
                        margin: '4px 0 0',
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && <div>{actions}</div>}
        </div>
    );
}
