export default function DashboardLoading() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                width: 40,
                height: 40,
                border: '3px solid var(--border)',
                borderTop: '3px solid var(--brand)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}
