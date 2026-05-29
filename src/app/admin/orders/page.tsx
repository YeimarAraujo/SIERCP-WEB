'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { ShoppingCart, Search, FileText, ChevronRight, RefreshCw, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPriceCOP, getPurchaseOrderLabel, getPurchaseOrderColor, type PurchaseOrder } from '@/shared/types/purchase-order';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) return;

            let url = '/api/admin/purchase-orders';
            if (statusFilter) url += `?status=${statusFilter}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (err) {
            console.error('Error fetching orders:', err);
            toast.error('Error al cargar las órdenes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const filtered = orders.filter(o =>
        searchTerm === '' ||
        (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.institutionName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = orders.reduce((sum, o) => sum + (o.totalCents || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle size={14} style={{ color: '#10B981' }} />;
            case 'CANCELLED': return <XCircle size={14} style={{ color: '#6B7280' }} />;
            case 'REFUNDED': return <RotateCcw size={14} style={{ color: '#EF4444' }} />;
            default: return <Clock size={14} style={{ color: '#F59E0B' }} />;
        }
    };

    const formatDate = (date: PurchaseOrder['createdAt']) => {
        if (!date) return '-';
        const d = date instanceof Date ? date : (date as any)?.toDate?.() ?? new Date(date as any);
        return d.toLocaleDateString('es-CO');
    };

    const columns = [
        {
            key: 'orderNumber',
            label: 'Orden',
            render: (_: any, row: PurchaseOrder) => (
                <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--foreground)' }}>{row.orderNumber}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(row.createdAt)}</div>
                </div>
            ),
        },
        {
            key: 'userName',
            label: 'Cliente',
            render: (_: any, row: PurchaseOrder) => (
                <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--foreground)' }}>{row.userName || '-'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.userEmail || '-'}</div>
                </div>
            ),
        },
        {
            key: 'institutionName',
            label: 'Institución',
            render: (val: any) => (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{val || '-'}</div>
            ),
        },
        {
            key: 'items',
            label: 'Items',
            render: (_: any, row: PurchaseOrder) => (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {row.items?.length || 0} {(row.items?.length || 0) === 1 ? 'item' : 'items'}
                </div>
            ),
        },
        {
            key: 'totalCents',
            label: 'Total',
            render: (val: any) => (
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--foreground)' }}>
                    {formatPriceCOP(val || 0)}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getStatusIcon(val)}
                    <span style={{
                        fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 20,
                        background: `${getPurchaseOrderColor(val)}20`,
                        color: getPurchaseOrderColor(val),
                        letterSpacing: '0.05em',
                    }}>
                        {getPurchaseOrderLabel(val)}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: () => <ChevronRight size={18} style={{ color: 'var(--border-strong)' }} />,
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión de Órdenes" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Órdenes de Compra"
                    subtitle={`Seguimiento de transacciones y órdenes de compra (${orders.length} órdenes)`}
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button
                            onClick={fetchOrders}
                            style={{
                                padding: '10px 16px', borderRadius: 12, background: 'var(--card)',
                                color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 13,
                                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            <RefreshCw size={14} /> Actualizar
                        </button>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[
                        { label: 'Total Transaccionado', value: formatPriceCOP(totalAmount), color: 'var(--brand)' },
                        { label: 'Pendientes', value: pendingCount, color: '#F59E0B' },
                        { label: 'Completadas', value: completedCount, color: '#10B981' },
                    ].map((s, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 40, height: 40, borderRadius: 10, background: `${s.color}10`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
                                }}
                            >
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>
                                    {loading ? '...' : s.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ position: 'relative', maxWidth: 350, flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por orden, cliente o institución..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14,
                                        border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--muted)',
                                    }}
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    height: 48, padding: '0 16px', borderRadius: 14,
                                    border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--muted)',
                                    fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                <option value="">Todos los estados</option>
                                <option value="PENDING">Pendientes</option>
                                <option value="COMPLETED">Completadas</option>
                                <option value="CANCELLED">Canceladas</option>
                                <option value="REFUNDED">Reembolsadas</option>
                            </select>
                        </div>
                        <button
                            onClick={() => {
                                if (orders.length === 0) return toast.error('No hay órdenes para exportar');
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--card)',
                                border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer',
                            }}
                        >
                            <FileText size={16} /> Exportar
                        </button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        emptyMessage="No se han encontrado órdenes de compra."
                    />
                </div>
            </div>
        </div>
    );
}