'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import {
    collection, query, where, getDocs, getDoc, doc, orderBy, limit, updateDoc, serverTimestamp,
    type Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import {
    Building2, ShieldCheck, Cpu, Package,
    CreditCard, Receipt, ChevronRight, Loader2,
} from 'lucide-react';
import { corporatePlans, sstConLicenciaPlans, sstSinLicenciaPlans, maniquiPackages } from '@/data/planes';
import { PageHero } from '@/components/ui/page-hero';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCOP(n: number) {
    if (n === 0) return 'Gratis';
    return `$${n.toLocaleString('es-CO')} COP`;
}

// ── Plan config ────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { name: string; price: string; color: string; desc: string }> = {
    starter: { name: 'Starter', price: 'Gratis', color: '#64748b', desc: 'Hasta 5 usuarios · 1 curso · 1 dispositivo' },
    pyme: { name: 'PYME', price: '$380.000/mes', color: '#6366f1', desc: '15 usuarios · 3 cursos · 2 dispositivos' },
    business: { name: 'Business', price: '$790.000/mes', color: '#0ea5e9', desc: '50 usuarios · 10 cursos · 5 dispositivos' },
    corporate: { name: 'Corporate', price: '$1.580.000/mes', color: '#10b981', desc: '200 usuarios · Cursos ilimitados · 15 dispositivos' },
    enterprise: { name: 'Enterprise', price: 'A medida', color: '#f59e0b', desc: 'Ilimitado · White-label · API completa' },
};

// Límites por plan (−1 = ilimitado). Basados en planes.ts/comparisons.
const PLAN_LIMITS: Record<string, { students: number; courses: number; devices: number; certs: number; sedes: number }> = {
    starter: { students: 5, courses: 1, devices: 1, certs: 10, sedes: 1 },
    pyme: { students: 15, courses: 3, devices: 3, certs: 50, sedes: 3 },
    business: { students: 50, courses: 10, devices: 10, certs: 200, sedes: 5 },
    corporate: { students: 200, courses: -1, devices: 30, certs: -1, sedes: -1 },
    enterprise: { students: -1, courses: -1, devices: -1, certs: -1, sedes: -1 },
};

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface InstitutionData {
    planType: string;
    name: string;
    planExpiresAt?: Timestamp;
}

interface MembershipData {
    planType?: string;
    usageCurrentUsers: number;
    usageCurrentCourses: number;
    usageCertificatesThisMonth: number;
}

interface OrderDoc {
    id: string;
    planSlug?: string;
    product: string;
    total: number;
    status: string;
    createdAt: Timestamp | null;
}

// ── Plan status card ───────────────────────────────────────────────────────────

function PlanStatusCard({
    institution,
    membership,
    orders,
    loading,
    sedesCount,
}: {
    institution: InstitutionData | null;
    membership: MembershipData | null;
    orders: OrderDoc[];
    loading: boolean;
    sedesCount: number;
}) {
    // Read planType from multiple sources in priority order to handle
    // institutions created before planType was added to the checkout flow.
    const rawSlug =
        institution?.planType ||
        membership?.planType ||
        orders[0]?.planSlug ||
        'starter';
    const planSlug = rawSlug.toLowerCase().trim();
    const info = PLAN_META[planSlug] ?? PLAN_META.starter;
    const limits = PLAN_LIMITS[planSlug] ?? PLAN_LIMITS.starter;

    const bars = [
        { label: 'Estudiantes', used: membership?.usageCurrentUsers ?? 0, max: limits.students, color: '#6366f1' },
        { label: 'Cursos', used: membership?.usageCurrentCourses ?? 0, max: limits.courses, color: '#0ea5e9' },
        { label: 'Certificados/mes', used: membership?.usageCertificatesThisMonth ?? 0, max: limits.certs, color: '#f59e0b' },
        { label: 'Sedes', used: sedesCount, max: limits.sedes, color: '#10b981' },
    ];

    const expires = institution?.planExpiresAt?.toDate?.();

    return (
        <div style={{ border: `2px solid ${info.color}30`, borderRadius: 18, background: 'var(--bg-surface)', padding: '20px 24px', marginBottom: 20 }}>
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Cargando plan…
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Plan activo</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>{info.name}</span>
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: `${info.color}18`, color: info.color, textTransform: 'uppercase' }}>ACTIVO</span>
                            </div>
                            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{info.desc}</p>
                            {expires && (
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                                    Vence: {expires.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: info.color }}>{info.price}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Renovación anual</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                        {bars.map(u => {
                            const unlimited = u.max === -1;
                            const pct = unlimited ? 8 : Math.min(100, (u.used / u.max) * 100);
                            return (
                                <div key={u.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{u.label}</span>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: u.color }}>
                                            {unlimited ? `${u.used} / ∞` : `${u.used}/${u.max}`}
                                        </span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: u.color, borderRadius: 999, transition: 'width 0.4s' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Purchase history ───────────────────────────────────────────────────────────

function HistoryTable({ orders, loading }: { orders: OrderDoc[]; loading: boolean }) {
    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-surface)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={16} color="var(--text-muted)" />
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Historial de compras</span>
            </div>
            {loading ? (
                <div style={{ padding: '24px 18px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14 }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cargando…
                </div>
            ) : orders.length === 0 ? (
                <div style={{ padding: '24px 18px', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
                    No hay compras registradas aún.
                </div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-surface-2)' }}>
                            {['Pedido', 'Fecha', 'Producto', 'Monto', 'Estado'].map(h => (
                                <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(r => (
                            <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: 'var(--brand)' }}>
                                    {r.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                    {r.createdAt?.toDate?.()?.toLocaleDateString('es-CO') ?? '—'}
                                </td>
                                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.product}</td>
                                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCOP(r.total)}</td>
                                <td style={{ padding: '10px 16px' }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981', textTransform: 'uppercase' }}>
                                        {r.status === 'paid' ? 'PAGADO' : r.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ── Product section helpers ────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Building2; title: string; subtitle: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <Icon size={18} color="var(--text-muted)" />
            </div>
            <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>
            </div>
        </div>
    );
}

function ProductCard({ name, desc, price, badge, highlight, checkoutUrl, isContact }: {
    name: string; desc: string; price: string; badge?: string | null;
    highlight?: boolean; checkoutUrl: string; isContact?: boolean;
}) {
    const router = useRouter();
    return (
        <div style={{
            border: `1px solid ${highlight ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 14, background: 'var(--bg-surface)', padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                </div>
                {badge && (
                    <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 20, background: highlight ? 'var(--brand)' : 'var(--bg-surface-2)', color: highlight ? '#fff' : 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{badge}</span>
                )}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>{price}</div>
            <button
                onClick={() => isContact ? window.open('mailto:soporte@siercp.co') : router.push(checkoutUrl)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--bg-surface-2)', color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
                {isContact ? 'Contactar ventas' : 'Comprar ahora'}
                <ChevronRight size={14} />
            </button>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminTiendaPage() {
    const { user, loading: authLoading } = useAuth();

    const institutionId: string | null = user?.institutionId ?? null;

    const [institution, setInstitution] = useState<InstitutionData | null>(null);
    const [membership, setMembership] = useState<MembershipData | null>(null);
    const [orders, setOrders] = useState<OrderDoc[]>([]);
    const [sedesCount, setSedesCount] = useState(0);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId || !user?.uid) {
            setLoadingPlan(false);
            setLoadingOrders(false);
            return;
        }

        // Load institution doc + membership doc (separados para que un fallo no bloquee al otro)
        const loadPlan = async () => {
            let instData: InstitutionData | null = null;
            let memData: MembershipData | null = null;

            try {
                const instSnap = await getDoc(doc(db, 'institutions', institutionId));
                if (instSnap.exists()) {
                    instData = instSnap.data() as InstitutionData;
                    setInstitution(instData);
                }
            } catch (err) {
                console.error('Error loading institution:', err);
            }

            try {
                const memSnap = await getDoc(doc(db, 'memberships', `${user.uid}_${institutionId}`));
                if (memSnap.exists()) {
                    memData = memSnap.data() as MembershipData;
                    setMembership(memData);
                }
            } catch {
                // Membership no existe o sin permisos — barras de uso en 0
            }

            // Auto-repair: if institution doc is missing planType but membership has it,
            // write it back so future loads work without the fallback chain.
            if (instData && !instData.planType && memData?.planType) {
                try {
                    await updateDoc(doc(db, 'institutions', institutionId), {
                        planType: memData.planType,
                        updatedAt: serverTimestamp(),
                    });
                    setInstitution(prev => prev ? { ...prev, planType: memData!.planType! } : prev);
                } catch {
                    // silently ignore — repair is best-effort
                }
            }

            setLoadingPlan(false);
        };

        // Load orders
        const loadOrders = async () => {
            try {
                const snap = await getDocs(query(
                    collection(db, 'orders'),
                    where('institutionId', '==', institutionId),
                    orderBy('createdAt', 'desc'),
                    limit(20),
                ));
                setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderDoc)));
            } catch {
                // Sin órdenes o sin permisos — historial vacío
            } finally {
                setLoadingOrders(false);
            }
        };

        // Load sedes count
        const loadSedes = async () => {
            try {
                const snap = await getDocs(query(
                    collection(db, 'sedes'),
                    where('institutionId', '==', institutionId),
                ));
                setSedesCount(snap.size);
            } catch {
                // best-effort
            }
        };

        loadPlan();
        loadOrders();
        loadSedes();
    }, [institutionId, user?.uid, authLoading]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>

            <Header title="Mi Plan · Tienda" />

            {/* Hero */}
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <PageHero
                    title="Mi Plan"
                    subtitle={institution?.name
                        ? `${institution.name} · Gestiona tu suscripción y recursos.`
                        : 'Gestiona tu suscripción, revisa el uso y agrega recursos.'}
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CreditCard size={16} color="var(--text-muted)" />
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</span>
                        </div>
                    }
                />


                {/* Sin institución asignada */}
                {
                    !authLoading && !institutionId && !loadingPlan && (
                        <div style={{
                            padding: '20px 24px', borderRadius: 16,
                            background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                            color: '#ef4444', fontWeight: 700, fontSize: 14,
                        }}>
                            Tu cuenta no tiene una institución asignada. Si acabas de registrarte, recarga la página. Si el problema persiste, contacta al soporte.
                        </div>
                    )
                }

                {/* Plan status */}
                <PlanStatusCard institution={institution} membership={membership} orders={orders} loading={loadingPlan} sedesCount={sedesCount} />

                {/* History */}
                <HistoryTable orders={orders} loading={loadingOrders} />

                {/* Catalog: Planes corporativos */}
                <div>
                    <SectionTitle icon={Building2} title="Planes corporativos" subtitle="Incluyen maniquíes y plataforma completa" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                        {corporatePlans.map(p => (
                            <ProductCard
                                key={p.slug}
                                name={p.name}
                                desc={p.desc}
                                price={p.isContact ? 'A medida' : `${formatCOP(p.monthlyCOP)}/mes`}
                                badge={p.badge}
                                highlight={p.highlight}
                                checkoutUrl={`/checkout/plan?plan=${p.slug}`}
                                isContact={p.isContact}
                            />
                        ))}
                    </div>
                </div>

                {/* Catalog: Maniquíes */}
                <div>
                    <SectionTitle icon={Cpu} title="Paquetes de maniquíes" subtitle="Dispositivos IoT SIERCP — pago único" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                        {maniquiPackages.map(p => (
                            <ProductCard
                                key={p.slug}
                                name={p.name}
                                desc={p.desc}
                                price={p.totalPriceCOP === null ? 'Cotización' : formatCOP(p.totalPriceCOP)}
                                badge={p.badge}
                                highlight={p.highlight}
                                checkoutUrl={`/checkout/manikin?pack=${p.slug}`}
                                isContact={p.totalPriceCOP === null}
                            />
                        ))}
                    </div>
                </div>

                {/* Catalog: Licencias SST */}
                <div>
                    <SectionTitle icon={ShieldCheck} title="Licencias SST" subtitle="Suscripción mensual con certificados incluidos" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                        {sstConLicenciaPlans.map(p => (
                            <ProductCard
                                key={p.slug}
                                name={p.name}
                                desc={p.desc}
                                price={`${formatCOP(p.monthlyCOP)}/mes`}
                                badge={p.badge}
                                highlight={p.highlight}
                                checkoutUrl={`/checkout/licencia-sst?plan=${p.slug}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Catalog: Packs SST sin licencia */}
                <div>
                    <SectionTitle icon={Package} title="Packs de certificados SST" subtitle="Pago único sin suscripción" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                        {sstSinLicenciaPlans.map(p => (
                            <ProductCard
                                key={p.slug}
                                name={p.name}
                                desc={p.desc}
                                price={formatCOP(p.monthlyCOP)}
                                badge={p.badge}
                                highlight={p.highlight}
                                checkoutUrl={`/checkout/pack?pack=${p.slug}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div >
    );
}
