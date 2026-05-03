'use client';

interface SensorItem {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'maintenance';
    lastReading?: string;
    battery?: number;
}

interface SensorListProps {
    sensors: SensorItem[];
    loading?: boolean;
}

const statusColors: Record<string, { dot: string; label: string }> = {
    online: { dot: '#10B981', label: 'Online' },
    offline: { dot: '#EF4444', label: 'Offline' },
    maintenance: { dot: '#F59E0B', label: 'Mantenimiento' },
};

export function SensorList({ sensors, loading = false }: SensorListProps) {
    if (loading) {
        return (
            <div className="card-padded">
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                    Sensores
                </h3>
                {[...Array(4)].map((_, i) => (
                    <div key={i} style={{
                        height: 56,
                        background: 'var(--bg-surface-2)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 8,
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                ))}
            </div>
        );
    }

    if (sensors.length === 0) {
        return (
            <div className="card-padded" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                    No hay sensores disponibles
                </p>
            </div>
        );
    }

    return (
        <div className="card-padded">
            <h3 style={{
                fontSize: 16, fontWeight: 700,
                color: 'var(--text-primary)', margin: '0 0 16px',
            }}>
                Sensores ({sensors.length})
            </h3>

            <div style={{
                display: 'flex', flexDirection: 'column', gap: '8px',
                maxHeight: 400, overflowY: 'auto',
                paddingRight: 4,
            }}>
                {sensors.map((sensor) => {
                    const statusInfo = statusColors[sensor.status] ?? statusColors.offline;
                    return (
                        <div
                            key={sensor.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-sm)',
                                cursor: 'pointer',
                                transition: 'box-shadow 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: 8, height: 8,
                                    borderRadius: '50%',
                                    background: statusInfo.dot,
                                    boxShadow: `0 0 0 3px ${statusInfo.dot}20`,
                                }} />
                                <div>
                                    <div style={{
                                        fontSize: 13, fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}>
                                        {sensor.name}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: 'var(--text-muted)',
                                    }}>
                                        {sensor.type} · {statusInfo.label}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {sensor.battery !== undefined && (
                                    <div style={{
                                        fontSize: 13, fontWeight: 600,
                                        color: sensor.battery > 20 ? 'var(--success-text)' : 'var(--danger-text)',
                                    }}>
                                        {sensor.battery}%
                                    </div>
                                )}
                                {sensor.lastReading && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {sensor.lastReading}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
