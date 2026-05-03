'use client';

import { Header } from '@/components/layout/header';
import { MetricBar } from '@/components/charts/metric-bar';
import { useAuthStore } from '@/stores/auth-store';
import { getUserInitials, getFullName } from '@/models/user';

export default function StudentProfilePage() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    if (!user) return null;
    const stats = user.stats;

    return (
        <div style={{ padding: 24, maxWidth: 480 }}>
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E4F0',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: '#1800AD', color: '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 700,
                    }}>
                        {getUserInitials(user)}
                    </div>
                    <div>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#0B1C30', margin: '0 0 2px' }}>
                            {getFullName(user)}
                        </p>
                        <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>{user.email}</p>
                        <span style={{
                            display: 'inline-block', marginTop: 4,
                            fontSize: 11, fontWeight: 500,
                            padding: '2px 8px', borderRadius: 999,
                            background: '#EEF0FF', color: '#1800AD',
                        }}>
                            {user.role}
                        </span>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #E2E4F0' }}>
                    {[
                        { label: 'Nombre completo', value: getFullName(user) },
                        { label: 'Correo', value: user.email },
                        { label: 'Identificación', value: user.identificacion ?? '—' },
                        { label: 'Estado', value: user.isActive ? 'Activo' : 'Inactivo' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '10px 0', borderBottom: '1px solid #E2E4F0',
                            fontSize: 13,
                        }}>
                            <span style={{ color: '#8892A4' }}>{label}</span>
                            <span style={{ fontWeight: 500, color: '#0B1C30' }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {stats && (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 16,
                }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0B1C30', marginBottom: 12 }}>
                        Estadísticas
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                        {[
                            { label: 'Sesiones totales', value: stats.totalSessions },
                            { label: 'Horas entrenadas', value: stats.totalHours.toFixed(1) + 'h' },
                            { label: 'Mejor puntaje', value: stats.bestScore.toFixed(1) + 'pts' },
                            { label: 'Racha actual', value: stats.streakDays + ' días' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ background: '#F0F1FA', borderRadius: 8, padding: '10px 12px' }}>
                                <p style={{ fontSize: 11, color: '#8892A4', margin: '0 0 2px' }}>{label}</p>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#0B1C30', margin: 0 }}>{value}</p>
                            </div>
                        ))}
                    </div>
                    <MetricBar label="Profundidad promedio" value={stats.averageDepthMm} max={70} unit=" mm" color="#10B981" />
                    <MetricBar label="Frecuencia promedio" value={stats.averageRatePerMin} max={130} unit=" /min" color="#10B981" />
                </div>
            )}

            <button
                onClick={logout}
                style={{
                    width: '100%', padding: '10px 0',
                    borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: '1px solid #EF4444', color: '#EF4444',
                    background: 'transparent', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
                Cerrar sesión
            </button>
        </div>
    );
}
