'use client';

import type { ReactNode } from 'react';
import { Activity, AlertTriangle, Award, Building2, Gauge, RefreshCcw, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useSuperAdminAnalytics } from '@/features/analytics/hooks/use-super-admin-analytics';
import type { AnalyticsActivityItem, AnalyticsRankingItem } from '@/features/analytics/services/super-admin-analytics.service';

function formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO').format(value || 0);
}

function formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function StatCard({
    label,
    value,
    detail,
    icon: Icon,
    accent,
    loading,
}: {
    label: string;
    value: string;
    detail: string;
    icon: typeof Users;
    accent: string;
    loading: boolean;
}) {
    return (
        <div style={{
            padding: 20,
            borderRadius: 24,
            border: '1px solid var(--border)',
            background: 'linear-gradient(145deg, var(--bg-surface), var(--bg-surface-2))',
            boxShadow: 'var(--shadow-sm)',
            minHeight: 142,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                <div>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</p>
                    {loading ? (
                        <div style={{ width: 92, height: 34, borderRadius: 10, background: 'var(--bg-surface-2)', marginTop: 14, animation: 'pulse 1.4s infinite' }} />
                    ) : (
                        <h2 style={{ margin: '10px 0 4px', fontSize: 34, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{value}</h2>
                    )}
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{detail}</p>
                </div>
                <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    display: 'grid',
                    placeItems: 'center',
                    background: accent,
                    color: 'var(--text-on-brand)',
                    boxShadow: '0 12px 24px rgba(24,0,173,.18)',
                }}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
    return (
        <section style={{
            border: '1px solid var(--border)',
            borderRadius: 26,
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
        }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>{title}</h3>
                {subtitle && <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{subtitle}</p>}
            </div>
            <div style={{ padding: 20 }}>{children}</div>
        </section>
    );
}

function RankingList({ items, empty }: { items: AnalyticsRankingItem[]; empty: string }) {
    if (!items.length) {
        return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>{empty}</div>;
    }

    const max = Math.max(...items.map((item) => item.value), 1);
    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {items.map((item, index) => (
                <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>{index + 1}. {item.name}</div>
                            {item.secondary && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.secondary}</div>}
                        </div>
                        <strong style={{ color: 'var(--clr-primary)' }}>{formatNumber(item.value)}</strong>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.max(8, (item.value / max) * 100)}%`, background: 'linear-gradient(90deg, var(--brand), var(--clr-primary-light))', borderRadius: 999 }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ActivityList({ items, empty }: { items: AnalyticsActivityItem[]; empty: string }) {
    if (!items.length) {
        return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>{empty}</div>;
    }

    const colors = { info: 'var(--brand)', warning: '#f59e0b', critical: '#ef4444' };
    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-surface-2)' }}>
                    <div style={{ width: 10, borderRadius: 999, background: colors[item.severity || 'info'] }} />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 850, color: 'var(--text-primary)', fontSize: 14 }}>{item.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.detail}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{formatDate(item.timestamp)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SuperAdminDashboard() {
    const { data, loading, error, refresh } = useSuperAdminAnalytics();
    const totals = data?.totals;

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>

            <div style={{
                borderRadius: 30,
                padding: 26,
                color: 'var(--text-on-brand)',
                background: 'radial-gradient(circle at top right, rgba(255,255,255,.20), transparent 32%), linear-gradient(135deg, var(--brand), #0f172a)',
                boxShadow: '0 22px 50px rgba(24,0,173,.22)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
            }}>
                <div>
                    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.13)', fontSize: 12, fontWeight: 800, marginBottom: 14 }}>
                        <ShieldCheck size={15} />
                        SaaS Control Center
                    </div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 950, letterSpacing: '-0.05em' }}>Operación global SIERCP</h1>
                    <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,.78)', maxWidth: 720 }}>
                        Métricas agregadas, actividad crítica, licencias y rendimiento multi-institución sin escanear colecciones completas.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ padding: '9px 12px', borderRadius: 999, background: data?.source === 'stats' ? 'rgba(34,197,94,.18)' : 'rgba(245,158,11,.20)', border: '1px solid rgba(255,255,255,.22)', fontSize: 12, fontWeight: 800 }}>
                        Fuente: {data?.source === 'stats' ? 'stats/global' : 'fallback optimizado'}
                    </span>
                    <button onClick={refresh} disabled={loading} style={{ border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.12)', color: 'var(--text-on-brand)', borderRadius: 14, padding: '10px 12px', cursor: 'pointer' }}>
                        <RefreshCcw size={17} />
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: 14, borderRadius: 16, border: '1px solid rgba(239,68,68,.25)', color: '#ef4444', background: 'rgba(239,68,68,.08)' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <StatCard label="Instituciones activas" value={`${formatNumber(totals?.activeInstitutions || 0)}/${formatNumber(totals?.institutions || 0)}`} detail="Tenants operativos" icon={Building2} accent="var(--brand)" loading={loading} />
                <StatCard label="Usuarios activos" value={formatNumber(totals?.users || 0)} detail={`${formatNumber(totals?.students || 0)} estudiantes registrados`} icon={Users} accent="#0f766e" loading={loading} />
                <StatCard label="Sesiones clínicas" value={formatNumber(totals?.sessions || 0)} detail="Entrenamientos y evaluaciones" icon={Activity} accent="#ea580c" loading={loading} />
                <StatCard label="Certificados" value={formatNumber(totals?.certificates || 0)} detail="Folios verificables emitidos" icon={Award} accent="#7c3aed" loading={loading} />
                <StatCard label="Cursos activos" value={formatNumber(totals?.activeCourses || 0)} detail="Oferta institucional habilitada" icon={Gauge} accent="#0369a1" loading={loading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, .9fr)', gap: 18 }}>
                <Panel title="Tendencias mensuales" subtitle="Sesiones, usuarios y certificados desde stats/global o fallback limitado">
                    <div style={{ height: 310 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trends || []}>
                                <defs>
                                    <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.38} />
                                        <stop offset="95%" stopColor="var(--brand)" stopOpacity={0.03} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="sessions" name="Sesiones" stroke="var(--brand)" fill="url(#sessionsGradient)" strokeWidth={3} />
                                <Area type="monotone" dataKey="certificates" name="Certificados" stroke="#7c3aed" fill="#7c3aed22" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Estado de licencias" subtitle="Capacidad y salud comercial">
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Activas', value: data?.licenses.active || 0 },
                                { name: 'Pendientes', value: data?.licenses.pending || 0 },
                                { name: 'Suspendidas', value: data?.licenses.suspended || 0 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="var(--brand)" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 8, padding: 14, borderRadius: 16, background: 'var(--bg-surface-2)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Utilización estimada</span>
                        <strong style={{ color: 'var(--clr-primary)' }}>{data?.licenses.utilizationPct || 0}%</strong>
                    </div>
                </Panel>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                <Panel title="Top instituciones" subtitle="Ranking por stats o capacidad registrada">
                    <RankingList items={data?.topInstitutions || []} empty="Aún no hay instituciones para ranking." />
                </Panel>
                <Panel title="Top cursos" subtitle="Cursos activos con mayor tracción">
                    <RankingList items={data?.topCourses || []} empty="Aún no hay cursos activos con estudiantes." />
                </Panel>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                <Panel title="Actividad reciente" subtitle="auditLogs limitado a últimos eventos">
                    <ActivityList items={data?.recentActivity || []} empty="No hay eventos de auditoría registrados." />
                </Panel>
                <Panel title="Sesiones recientes" subtitle="Últimos entrenamientos clínicos">
                    <ActivityList items={data?.recentSessions || []} empty="No hay sesiones recientes." />
                </Panel>
                <Panel title="Alertas y anomalías" subtitle="Riesgos operativos visibles">
                    {(data?.alerts || []).length ? (
                        <ActivityList items={data?.alerts || []} empty="Sin alertas." />
                    ) : (
                        <div style={{ padding: 24, borderRadius: 18, background: 'rgba(34,197,94,.08)', color: '#16a34a', display: 'flex', gap: 10, alignItems: 'center', fontWeight: 800 }}>
                            <AlertTriangle size={18} />
                            Sin anomalías críticas detectadas.
                        </div>
                    )}
                </Panel>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                <TrendingUp size={14} />
                Última actualización: {data ? formatDate(data.generatedAt) : 'cargando...'}
            </div>
        </div>
    );
}
