export default function AdminLoading() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', gap: 12,
        }}>
            <div style={{
                width: 36, height: 36,
                border: '3px solid var(--border)',
                borderTop: '3px solid var(--brand)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Cargando...</span>
        </div>
    );
}
