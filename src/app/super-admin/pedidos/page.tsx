'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Package, Truck, CheckCircle2, Clock, XCircle, RefreshCw, ChevronDown, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderType = 'plan-corporativo' | 'licencia-sst' | 'pack-sst' | 'manikin';
type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type ShippingStatus = 'pending' | 'preparing' | 'shipped' | 'delivered';

interface Order {
    orderId: string;
    userId?: string;
    institutionId?: string;
    type: OrderType;
    status: OrderStatus;
    shippingStatus?: ShippingStatus;
    total: number;
    payMethod: string;
    quantity?: number;
    createdAt: Timestamp | null;
    planSlug?: string;
    planName?: string;
    packSlug?: string;
    packName?: string;
    userEmail?: string;
    personal?: {
        nombreCompleto?: string;
        nombre?: string;
        email: string;
    };
    company?: {
        institucionName: string;
        email: string;
        nit: string;
    };
    buyer?: {
        razonSocial?: string;
        nombre?: string;
        email: string;
    };
    buyerType?: 'empresa' | 'persona';
    shipping?: {
        address: string;
        city: string;
        department: string;
    };
    user?: {
        name?: string;
        fullName?: string;
        email?: string;
    };
    institution?: {
        name?: string;
        institucionName?: string;
        email?: string;
        nit?: string;
    };
}
// ── Helpers ───────────────────────────────────────────────────────────────────

function getBuyerName(order: Order): string {
    if (order.institution?.institucionName)
        return order.institution.institucionName;

    if (order.institution?.name)
        return order.institution.name;

    if (order.user?.fullName)
        return order.user.fullName;

    if (order.user?.name)
        return order.user.name;

    if (order.company?.institucionName)
        return order.company.institucionName;

    if (order.buyer?.razonSocial)
        return order.buyer.razonSocial;

    if (order.buyer?.nombre)
        return order.buyer.nombre;

    if (order.personal?.nombreCompleto)
        return order.personal.nombreCompleto;

    if (order.personal?.nombre)
        return order.personal.nombre;

    return order.userEmail ?? '—';
}
function getBuyerEmail(order: Order): string {
    if (order.institution?.email)
        return order.institution.email;

    if (order.user?.email)
        return order.user.email;

    if (order.company?.email)
        return order.company.email;

    if (order.buyer?.email)
        return order.buyer.email;

    if (order.personal?.email)
        return order.personal.email;

    return order.userEmail ?? '—';

}

function fmt(n?: number | null) {
    if (typeof n !== 'number') return '—';
    return `$${n.toLocaleString('es-CO')}`;
}

function fmtDate(ts: Timestamp | null): string {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getProductName(order: Order): string {
    if (order.planName) return order.planName;
    if (order.planSlug) return order.planSlug;
    if (order.packName) return order.packName;
    if (order.packSlug) return order.packSlug;
    return '—';
}

const TYPE_LABELS: Record<OrderType, string> = {
    'plan-corporativo': 'Plan corporativo',
    'licencia-sst': 'Licencia SST',
    'pack-sst': 'Pack SST',
    'manikin': 'Maniquí IoT',
};

const TYPE_COLORS: Record<OrderType, string> = {
    'plan-corporativo': 'var(--clr-primary,#2563eb)',
    'licencia-sst': '#7c3aed',
    'pack-sst': '#d97706',
    'manikin': '#059669',
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending_payment: { label: 'Pago pendiente', color: '#92400e', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> },
    paid: { label: 'Pagado', color: '#1d4ed8', bg: 'rgba(37,99,235,0.1)', icon: <CheckCircle2 size={12} /> },
    processing: { label: 'En preparación', color: '#6d28d9', bg: 'rgba(124,58,237,0.1)', icon: <RefreshCw size={12} /> },
    shipped: { label: 'Enviado', color: '#0e7490', bg: 'rgba(6,182,212,0.1)', icon: <Truck size={12} /> },
    delivered: { label: 'Entregado', color: '#065f46', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={12} /> },
    cancelled: { label: 'Cancelado', color: '#991b1b', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={12} /> },
};

const SHIPPING_STATUSES: ShippingStatus[] = ['pending', 'preparing', 'shipped', 'delivered'];
const SHIPPING_LABELS: Record<ShippingStatus, string> = {
    pending: 'Pendiente',
    preparing: 'Preparando',
    shipped: 'Enviado',
    delivered: 'Entregado',
};

// ── Components ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_payment;
    return (
        <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {cfg.icon}{cfg.label}
        </span>
    );
}

function TypeBadge({ type }: { type: OrderType }) {
    return (
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: `${TYPE_COLORS[type]}18`, color: TYPE_COLORS[type], fontSize: 11, fontWeight: 700 }}>
            {TYPE_LABELS[type] ?? type}
        </span>
    );
}

function OrderDetail({ order, onClose, onUpdate }: { order: Order; onClose: () => void; onUpdate: (id: string, changes: Partial<Order>) => void }) {
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [shippingStatus, setShippingStatus] = useState<ShippingStatus>(order.shippingStatus ?? 'pending');
    const [saving, setSaving] = useState(false);

    const isManikin = order.type === 'manikin';

    const handleSave = async () => {
        setSaving(true);
        try {
            const changes: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
            if (isManikin) changes.shippingStatus = shippingStatus;
            await updateDoc(doc(db, 'orders', order.orderId), changes);
            onUpdate(order.orderId, { status, ...(isManikin ? { shippingStatus } : {}) });
            toast.success('Pedido actualizado');
            onClose();
        } catch {
            toast.error('Error al actualizar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={onClose}>
            <div style={{ background: 'var(--bg-card,#fff)', borderRadius: 20, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary,#6b7280)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pedido #{order.orderId.slice(-8).toUpperCase()}</p>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-primary,#111827)' }}>{getProductName(order)}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary,#6b7280)', fontSize: 20, lineHeight: 1 }}>×</button>
                </div>

                <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                    {[
                        ['Tipo', <TypeBadge key="t" type={order.type} />],
                        ['Estado', <StatusBadge key="s" status={order.status} />],
                        ['Comprador', getBuyerName(order)],
                        ['Correo', getBuyerEmail(order)],
                        ['Total', fmt(order.total) + ' COP'],
                        ['Método de pago', order.payMethod === 'card' ? 'Tarjeta' : order.payMethod === 'manual' ? 'Manual (super admin)' : 'PSE'],
                        ['Fecha', fmtDate(order.createdAt)],
                        ...(order.quantity ? [['Cantidad', `${order.quantity} maniquí${order.quantity > 1 ? 'es' : ''}`]] : []),
                        ...(order.shipping ? [['Dirección de envío', `${order.shipping.address}, ${order.shipping.city}, ${order.shipping.department}`]] : []),
                    ].map(([label, value]) => (
                        <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border,#f3f4f6)' }}>
                            <span style={{ color: 'var(--text-secondary,#6b7280)', fontWeight: 600 }}>{label}</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary,#111827)', textAlign: 'right' }}>{value as React.ReactNode}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary,#6b7280)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Estado del pedido</label>
                        <div style={{ position: 'relative' }}>
                            <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)}
                                style={{ width: '100%', height: 42, padding: '0 36px 0 14px', borderRadius: 10, border: '1.5px solid var(--border,#e5e7eb)', background: 'var(--bg-card,#fff)', color: 'var(--text-primary,#111827)', fontSize: 14, fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                                {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary,#6b7280)' }} />
                        </div>
                    </div>

                    {isManikin && (
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary,#6b7280)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Estado de envío</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {SHIPPING_STATUSES.map(ss => (
                                    <button key={ss} onClick={() => setShippingStatus(ss)}
                                        style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${shippingStatus === ss ? 'var(--clr-primary,#2563eb)' : 'var(--border,#e5e7eb)'}`, background: shippingStatus === ss ? 'rgba(37,99,235,0.08)' : 'transparent', color: shippingStatus === ss ? 'var(--clr-primary,#2563eb)' : 'var(--text-secondary,#6b7280)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                                        {SHIPPING_LABELS[ss]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', color: 'var(--text-secondary,#6b7280)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleSave} disabled={saving}
                        style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--clr-primary,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'plan-corporativo', label: 'Planes corporativos' },
    { value: 'licencia-sst', label: 'Licencias SST' },
    { value: 'pack-sst', label: 'Packs SST' },
    { value: 'manikin', label: 'Maniquíes' },
];

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'Todos los estados' },
    ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
];

export default function PedidosPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState<Order | null>(null);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const snap = await getDocs(
                query(
                    collection(db, 'orders'),
                    orderBy('createdAt', 'desc')
                )
            );

            const ordersData = await Promise.all(
                snap.docs.map(async (d) => {
                    const order = {
                        orderId: d.id,
                        ...d.data(),
                    } as Order;

                    let user;
                    let institution;

                    if (order.userId) {
                        const userSnap = await getDoc(
                            doc(db, 'users', order.userId)
                        );

                        if (userSnap.exists()) {
                            user = userSnap.data();
                        }
                    }

                    if (order.institutionId) {
                        const institutionSnap = await getDoc(
                            doc(db, 'institutions', order.institutionId)
                        );

                        if (institutionSnap.exists()) {
                            institution = institutionSnap.data();
                        }
                    }

                    return {
                        ...order,
                        user,
                        institution,
                    };
                })
            );

            setOrders(ordersData);
        } catch (e) {
            console.error(e);
            toast.error('Error cargando pedidos');
        } finally {
            setLoading(false);
        }
    }, []);



    useEffect(() => { load(); }, [load]);

    const handleUpdate = (id: string, changes: Partial<Order>) => {
        setOrders(prev => prev.map(o => o.orderId === id ? { ...o, ...changes } : o));
    };

    const filtered = orders.filter(o =>
        (typeFilter === 'all' || o.type === typeFilter) &&
        (statusFilter === 'all' || o.status === statusFilter)
    );

    const totalRevenue = filtered.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const pendingCount = filtered.filter(o => o.status === 'pending_payment').length;
    const manikinPending = filtered.filter(o => o.type === 'manikin' && (o.shippingStatus === 'pending' || o.shippingStatus === 'preparing')).length;

    const selectStyle: React.CSSProperties = {
        height: 38, padding: '0 36px 0 12px', borderRadius: 8, border: '1.5px solid var(--border,#e5e7eb)',
        color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
        outline: 'none', appearance: 'none', cursor: 'pointer',
    };

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header />

            <PageHero
                title="Gestión de Pedidos y compras"
                subtitle="Administra pedidos, pagos, envíos y detalles de los clientes"
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
            />

            {selected && (
                <OrderDetail order={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
            )}


            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                {[
                    { label: 'Total pedidos (filtrado)', value: filtered.length, icon: <Package size={18} />, color: 'var(--clr-primary)' },
                    { label: 'Pago pendiente', value: pendingCount, icon: <Clock size={18} />, color: '#d97706' },
                    { label: 'Maniquíes por enviar', value: manikinPending, icon: <Truck size={18} />, color: '#059669' },
                ].map(({ label, value, icon, color }) => (
                    <div key={label} style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{value}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters + Revenue */}
            <div style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
                        {TYPE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary,#6b7280)' }} />
                </div>
                <div style={{ position: 'relative' }}>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
                        {STATUS_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary,#6b7280)' }} />
                </div>
                <button onClick={load} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary,#6b7280)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <RefreshCw size={14} />Actualizar
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary,#6b7280)' }}>Ingresos (filtro):</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary,#111827)' }}>{fmt(totalRevenue)} COP</span>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 100px 110px 60px', gap: 0, padding: '12px 20px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    <span>Comprador / producto</span>
                    <span>Tipo</span>
                    <span>Estado</span>
                    <span>Total</span>
                    <span>Fecha</span>
                    <span></span>
                </div>

                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary,#6b7280)', fontSize: 14 }}>Cargando pedidos…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary,#6b7280)', fontSize: 14 }}>
                        <Package size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p style={{ margin: 0 }}>No hay pedidos con los filtros seleccionados</p>
                    </div>
                ) : (
                    filtered.map((order, i) => (
                        <div key={order.orderId} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 100px 110px 60px', gap: 0, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border,#f3f4f6)' : 'none', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: 'var(--text-primary,#111827)' }}>{getBuyerName(order)}</p>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary,#6b7280)' }}>{getProductName(order)} · {getBuyerEmail(order)}</p>
                                {order.type === 'manikin' && order.shippingStatus && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0e7490', background: 'rgba(6,182,212,0.1)', padding: '2px 7px', borderRadius: 10, marginTop: 3, display: 'inline-block' }}>
                                        Envío: {SHIPPING_LABELS[order.shippingStatus]}
                                    </span>
                                )}
                            </div>
                            <TypeBadge type={order.type} />
                            <StatusBadge status={order.status} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary,#111827)' }}>{fmt(order.total)}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary,#6b7280)' }}>{fmtDate(order.createdAt)}</span>
                            <button onClick={() => setSelected(order)}
                                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border,#e5e7eb)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary,#6b7280)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                                <Eye size={13} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
