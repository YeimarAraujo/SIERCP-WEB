'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Activity, AlertTriangle, Award, Building2,
    RefreshCcw, ShieldCheck, TrendingUp, Users, DollarSign,
    BookOpen, GraduationCap, BookMarked, ArrowRight, Package,
} from 'lucide-react';
import {
    Area, AreaChart, BarChart, Bar,
    CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { maniquiPackages } from '@/data/planes';
import { useSuperAdminAnalytics } from '@/features/analytics/hooks/use-super-admin-analytics';
import type { AnalyticsActivityItem, AnalyticsRankingItem } from '@/features/analytics/services/super-admin-analytics.service';
import { DEFAULT_PLANS } from '@/shared/types/plan';
import { Header } from '@/components/layout/header';

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(value: number): string {
    return new Intl.NumberFormat('es-CO').format(value || 0);
}

function fmtDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function fmtCOP(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
    label, value, detail, icon: Icon, accent, loading, chip, href, trend,
}: {
    label: string;
    value: string;
    detail: string;
    icon: typeof Users;
    accent: string;
    loading: boolean;
    chip?: string;
    href?: string;
    trend?: number;
}) {
    const router = useRouter();
    return (
        <div
            onClick={href ? () => router.push(href) : undefined}
            style={{
                padding: 20, borderRadius: 20, border: '1px solid var(--border)',
                background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)',
                cursor: href ? 'pointer' : 'default',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                display: 'flex', flexDirection: 'column', gap: 0,
            }}
            onMouseEnter={e => { if (href) { (e.currentTarget as HTMLElement).style.borderColor = accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${accent}20`; } }}
            onMouseLeave={e => { if (href) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</p>
                        {chip && (
                            <span style={{ padding: '1px 6px', borderRadius: 999, fontSize: 9, fontWeight: 800, background: 'var(--brand-light)', color: 'var(--brand)' }}>{chip}</span>
                        )}
                    </div>
                    {loading ? (
                        <div style={{ width: 80, height: 30, borderRadius: 8, background: 'var(--bg-surface-2)', marginTop: 12, animation: 'pulse 1.4s infinite' }} />
                    ) : (
                        <h2 style={{ margin: '8px 0 2px', fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{value}</h2>
                    )}
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12 }}>{detail}</p>
                    {trend !== undefined && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: trend >= 0 ? '#10b981' : '#ef4444' }}>
                            {trend >= 0 ? '+' : ''}{trend}% vs. mes anterior
                        </p>
                    )}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${accent}18`, color: accent, flexShrink: 0 }}>
                    <Icon size={20} />
                </div>
            </div>
            {href && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: accent }}>
                    <ArrowRight size={12} />Ver detalle
                </div>
            )}
        </div>
    );
}


function RankingList({ items, empty }: { items: AnalyticsRankingItem[]; empty: string }) {
    if (!items.length) {
        return (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>
                {empty}
            </div>
        );
    }
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {items.map((item, index) => (
                <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>{index + 1}. {item.name}</div>
                            {item.secondary && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.secondary}</div>}
                        </div>
                        <strong style={{ color: 'var(--brand)' }}>{fmt(item.value)}</strong>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.max(8, (item.value / max) * 100)}%`,
                            background: 'linear-gradient(90deg, var(--brand), var(--brand-hover))',
                            borderRadius: 999,
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ActivityList({ items, empty }: { items: AnalyticsActivityItem[]; empty: string }) {
    if (!items.length) {
        return (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>
                {empty}
            </div>
        );
    }
    const colors: Record<string, string> = { info: 'var(--brand)', warning: '#f59e0b', critical: '#ef4444' };
    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {items.map((item) => (
                <div key={item.id} style={{
                    display: 'flex', gap: 12, padding: 12,
                    border: '1px solid var(--border)', borderRadius: 16,
                    background: 'var(--bg-surface-2)',
                }}>
                    <div style={{ width: 4, borderRadius: 999, background: colors[item.severity || 'info'], flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>{item.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.detail}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{fmtDate(item.timestamp)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── MRR estimado por plan ─────────────────────────────────────────────────────

function MrrCard({ institutions, loading }: { institutions: number; loading: boolean }) {
    const planPrices = DEFAULT_PLANS.map((p) => ({
        name: p.name,
        price: p.priceCOP === -1 ? 0 : p.priceCOP,
    }));

    return (
        <div style={{
            padding: 20, borderRadius: 24,
            border: '1px solid var(--border)',
            background: 'linear-gradient(145deg, var(--bg-surface), var(--bg-surface-2))',
            boxShadow: 'var(--shadow-sm)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>MRR Potencial</p>
                    {loading ? (
                        <div style={{ width: 120, height: 34, borderRadius: 10, background: 'var(--bg-surface-2)', marginTop: 14, animation: 'pulse 1.4s infinite' }} />
                    ) : (
                        <h2 style={{ margin: '10px 0 4px', fontSize: 34, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                            {fmtCOP(planPrices.filter(p => p.price > 0).reduce((sum, p) => sum + p.price, 0))}
                        </h2>
                    )}
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                        {institutions} institución{institutions !== 1 ? 'es' : ''} · suma de planes activos
                    </p>
                </div>
                <div style={{
                    width: 46, height: 46, borderRadius: 16,
                    display: 'grid', placeItems: 'center',
                    background: '#059669', color: '#fff',
                    boxShadow: '0 12px 24px #05966944',
                    flexShrink: 0,
                }}>
                    <DollarSign size={22} />
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${planPrices.length}, 1fr)`, gap: 8, marginTop: 16 }}>
                {planPrices.map((p) => (
                    <div key={p.name} style={{
                        padding: '8px 10px', borderRadius: 12,
                        background: 'var(--bg-surface-3)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {p.price === 0 ? 'Gratis' : fmtCOP(p.price)}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// ── Stock chart (datos de Firestore) ─────────────────────────────────────────

interface StockChartEntry { name: string; Stock: number; Disponibles: number; Vendidos: number; }

function StockChart() {
    const [data, setData] = useState<StockChartEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!db) { setLoading(false); return; }
        Promise.all([
            getDocs(collection(db, 'stock')),
            getDocs(query(collection(db, 'orders'), where('type', '==', 'manikin'))),
        ]).then(([stockSnap, ordersSnap]) => {
            const stockMap = new Map(stockSnap.docs.map(d => [d.id, d.data() as { stock: number; reserved?: number }]));
            const salesMap = new Map<string, number>();
            ordersSnap.docs.forEach(d => {
                const { packSlug, quantity } = d.data() as { packSlug?: string; quantity?: number };
                if (packSlug) salesMap.set(packSlug, (salesMap.get(packSlug) ?? 0) + (quantity ?? 1));
            });
            const entries: StockChartEntry[] = maniquiPackages
                .filter(p => p.quantity !== null)
                .map(p => {
                    const s = stockMap.get(p.slug);
                    const stock = s?.stock ?? 0;
                    const reserved = s?.reserved ?? 0;
                    const name = p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name;
                    return { name, Stock: stock, Disponibles: Math.max(0, stock - reserved), Vendidos: salesMap.get(p.slug) ?? 0 };
                });
            setData(entries);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={18} style={{ color: '#2563eb' }} /> Stock de maniquíes
                    </h3>
                    <p style={{ margin: '4px 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Unidades en stock, disponibles y vendidas por modelo</p>
                </div>
                <button
                    onClick={() => router.push('/super-admin/stock')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                    Ver detalle <ArrowRight size={13} />
                </button>
            </div>
            {loading ? (
                <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Cargando…</div>
            ) : data.length === 0 ? (
                <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin datos de stock</div>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 0 }} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13 }} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        <Bar dataKey="Stock" fill="#2563eb" radius={[5, 5, 0, 0]} />
                        <Bar dataKey="Disponibles" fill="#059669" radius={[5, 5, 0, 0]} />
                        <Bar dataKey="Vendidos" fill="#7c3aed" radius={[5, 5, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}


export default function SuperAdminDashboard() {
    const { data, loading, error, refresh } = useSuperAdminAnalytics();
    const totals = data?.totals;

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header />

            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>


            {/* ── Hero ── */}
            <div style={{
                borderRadius: 30, padding: 26,
                color: '#fff',
                background: 'var(--brand)',
                boxShadow: '0 22px 50px rgba(24,0,173,.22)',
                display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
            }}>
                <div>
                    <div style={{
                        display: 'inline-flex', gap: 8, alignItems: 'center',
                        padding: '7px 11px', borderRadius: 999,
                        background: 'rgba(255,255,255,.13)', fontSize: 12, fontWeight: 800, marginBottom: 14,
                    }}>
                        <ShieldCheck size={15} />
                        SaaS Control Center
                    </div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 950, letterSpacing: '-0.05em' }}>
                        Operación global SIERCP
                    </h1>
                    <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,.78)', maxWidth: 720 }}>
                        Métricas agregadas, actividad crítica, licencias y rendimiento multi-institución.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                        padding: '9px 12px', borderRadius: 999,
                        background: data?.source === 'stats' ? 'rgba(34,197,94,.18)' : 'rgba(245,158,11,.20)',
                        border: '1px solid rgba(255,255,255,.22)', fontSize: 12, fontWeight: 800,
                    }}>
                        {data?.source === 'stats' ? '● stats/global' : '● fallback'}
                    </span>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        style={{
                            border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.12)',
                            color: '#fff', borderRadius: 14, padding: '10px 12px', cursor: 'pointer',
                        }}
                        title="Actualizar métricas"
                    >
                        <RefreshCcw size={17} />
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: 14, borderRadius: 16, border: '1px solid rgba(239,68,68,.25)', color: '#ef4444', background: 'rgba(239,68,68,.08)' }}>
                    {error}
                </div>
            )}

            {/* ── KPIs principales ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                <StatCard label="Instituciones" loading={loading} accent="#4f46e5"
                    value={`${fmt(totals?.activeInstitutions || 0)}/${fmt(totals?.institutions || 0)}`}
                    detail="Tenants operativos" icon={Building2}
                    href="/super-admin/institutions" trend={8} />
                <StatCard label="Usuarios" loading={loading} accent="#0f766e"
                    value={fmt(totals?.users || 0)}
                    detail={`${fmt(totals?.students || 0)} estudiantes`}
                    icon={Users} href="/super-admin/usuarios" trend={12} />
                <StatCard label="Instructores" loading={loading} accent="#0ea5e9"
                    value={fmt(totals?.instructors || 0)}
                    detail="Activos en plataforma" icon={GraduationCap}
                    href="/super-admin/instructores" trend={5} />
                <StatCard label="Cursos plataforma" loading={loading} accent="#0369a1"
                    value={fmt(totals?.activeCourses || 0)}
                    detail="Cursos activos" icon={BookOpen}
                    href="/super-admin/cursos" trend={3} />
                <StatCard label="Cursos Jomar" loading={loading} accent="#059669"
                    value={fmt(totals?.jomarCourses || 0)}
                    detail="Publicados en plataforma" icon={BookMarked}
                    href="/super-admin/cursos-jomar" trend={0} />
                <StatCard label="Sesiones clínicas" loading={loading} accent="#ea580c"
                    value={fmt(totals?.sessions || 0)}
                    detail="Entrenamientos totales" icon={Activity} trend={22} />
                <StatCard label="Certificados" loading={loading} accent="#7c3aed"
                    value={fmt(totals?.certificates || 0)}
                    detail="Folios emitidos" icon={Award} trend={18} />

            </div>

            {/* ── Gráfica de tendencias (fuera de cards) ── */}
            <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Tendencias mensuales</h3>
                <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Sesiones y certificados por mes</p>
                <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.trends || []}>
                            <defs>
                                <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="gCerts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)' }} />
                            <Area type="monotone" dataKey="sessions" name="Sesiones" stroke="#4f46e5" fill="url(#gSessions)" strokeWidth={3} />
                            <Area type="monotone" dataKey="certificates" name="Certificados" stroke="#7c3aed" fill="url(#gCerts)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Stock de maniquíes ── */}
            <StockChart />

            {/* ── Distribución de roles e instituciones ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Distribución de usuarios</h3>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Admins · Instructores · Estudiantes</p>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Admins', value: totals?.admins || 0 },
                                        { name: 'Instructores', value: totals?.instructors || 0 },
                                        { name: 'Estudiantes', value: totals?.students || 0 },
                                    ]}
                                    cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                    paddingAngle={3} dataKey="value"
                                >
                                    {['#4f46e5', '#0ea5e9', '#10b981'].map((color, i) => (
                                        <Cell key={i} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)' }} />
                                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13, color: 'var(--text-secondary)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Estado de instituciones</h3>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Activas · Pendientes · Suspendidas</p>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Activas', value: data?.licenses.active || 0 },
                                        { name: 'Pendientes', value: data?.licenses.pending || 0 },
                                        { name: 'Suspendidas', value: data?.licenses.suspended || 0 },
                                    ]}
                                    cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                    paddingAngle={3} dataKey="value"
                                >
                                    {['#10b981', '#f59e0b', '#ef4444'].map((color, i) => (
                                        <Cell key={i} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)' }} />
                                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13, color: 'var(--text-secondary)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── MRR + Licencias ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <MrrCard institutions={totals?.institutions || 0} loading={loading} />
                <div style={{
                    padding: 20, borderRadius: 24,
                    border: '1px solid var(--border)',
                    background: 'linear-gradient(145deg, var(--bg-surface), var(--bg-surface-2))',
                }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>Estado de licencias</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {[
                            { label: 'Activas', value: data?.licenses.active || 0, color: '#10b981' },
                            { label: 'Pendientes', value: data?.licenses.pending || 0, color: '#f59e0b' },
                            { label: 'Suspendidas', value: data?.licenses.suspended || 0, color: '#ef4444' },
                        ].map((s) => (
                            <div key={s.label} style={{
                                padding: '10px 12px', borderRadius: 14,
                                background: `${s.color}12`,
                                border: `1px solid ${s.color}30`,
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        marginTop: 14, padding: '10px 14px', borderRadius: 12,
                        background: 'var(--bg-surface-2)',
                        display: 'flex', justifyContent: 'space-between',
                    }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13 }}>Utilización estimada</span>
                        <strong style={{ color: 'var(--brand)' }}>{data?.licenses.utilizationPct || 0}%</strong>
                    </div>
                </div>
            </div>

            {/* ── Rankings ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Top instituciones</h3>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Ranking por actividad registrada</p>
                    <RankingList items={data?.topInstitutions || []} empty="Aún no hay instituciones para ranking." />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Top cursos</h3>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Cursos activos con mayor tracción</p>
                    <RankingList items={data?.topCourses || []} empty="Aún no hay cursos activos con estudiantes." />
                </div>
            </div>

            {/* ── Actividad reciente + Alertas ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Actividad reciente</h3>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Últimos eventos de auditoría</p>
                    <ActivityList items={data?.recentActivity || []} empty="No hay eventos de auditoría registrados." />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Sesiones recientes</h3>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Últimos entrenamientos clínicos</p>
                    <ActivityList items={data?.recentSessions || []} empty="No hay sesiones recientes." />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Alertas y anomalías</h3>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>Riesgos operativos visibles</p>
                    {(data?.alerts || []).length ? (
                        <ActivityList items={data?.alerts || []} empty="Sin alertas." />
                    ) : (
                        <div style={{
                            padding: 24, borderRadius: 18,
                            background: 'rgba(34,197,94,.08)', color: '#16a34a',
                            display: 'flex', gap: 10, alignItems: 'center', fontWeight: 800,
                        }}>
                            <AlertTriangle size={18} />
                            Sin anomalías críticas detectadas.
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                <TrendingUp size={14} />
                Última actualización: {data ? fmtDate(data.generatedAt) : 'cargando...'}
            </div>
        </div>
    );
}
