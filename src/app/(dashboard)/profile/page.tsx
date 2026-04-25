'use client';

import { Header } from '@/components/layout/header';
import { MetricBar } from '@/components/charts/metric-bar';
import { useAuth } from '@/hooks/use-auth';
import { getUserInitials, getFullName } from '@/models/user';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    if (!user) return null;

    const stats = user.stats;

    return (
        <div className="flex flex-col h-full">
            <Header title="Perfil" />
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-lg">

                {/* Avatar + info */}
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                        {getUserInitials(user)}
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{getFullName(user)}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <span className="mt-1 inline-block text-xs rounded-full bg-secondary px-2 py-0.5 font-medium">
                            {user.role}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="rounded-lg border border-border bg-card divide-y divide-border">
                    {[
                        { label: 'Nombre completo', value: getFullName(user) },
                        { label: 'Correo', value: user.email },
                        { label: 'Identificación', value: user.identificacion ?? '—' },
                        { label: 'Rol', value: user.role },
                        { label: 'Estado', value: user.isActive ? 'Activo' : 'Inactivo' },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between px-4 py-3 text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium">{value}</span>
                        </div>
                    ))}
                </div>

                {/* Stats */}
                {stats && (
                    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                        <p className="text-sm font-semibold">Estadísticas</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                { label: 'Sesiones totales', value: stats.totalSessions },
                                { label: 'Horas entrenadas', value: stats.totalHours.toFixed(1) + 'h' },
                                { label: 'Mejor puntaje', value: stats.bestScore.toFixed(1) + 'pts' },
                                { label: 'Racha actual', value: stats.streakDays + ' días' },
                            ].map(({ label, value }) => (
                                <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="font-semibold mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                        <MetricBar label="Profundidad promedio" value={stats.averageDepthMm} max={70} unit=" mm" color="#00E676" />
                        <MetricBar label="Frecuencia promedio" value={stats.averageRatePerMin} max={130} unit=" /min" color="#00E676" />
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full h-10 rounded-md border border-destructive text-destructive text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                    Cerrar sesión
                </button>

            </div>
        </div>
    );
}