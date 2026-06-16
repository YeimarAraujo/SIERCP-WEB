'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Building2, MapPin, User, ChevronRight, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface SedeModel {
    id: string;
    institutionId: string;
    name: string;
    city: string;
    address?: string;
    adminId?: string;
    adminName?: string;
    isActive: boolean;
    createdAt?: any;
}

const PLAN_SEDE_LIMITS: Record<string, number> = {
    starter: 1,
    pyme: 3,
    business: 5,
    corporate: -1,
    enterprise: -1,
};

function getPlanLimit(planType: string | undefined): number {
    const slug = (planType || 'starter').toLowerCase().trim();
    return PLAN_SEDE_LIMITS[slug] ?? 1;
}

function CreateSedeModal({
    onClose,
    onCreated,
    institutionId,
}: {
    onClose: () => void;
    onCreated: (sede: SedeModel) => void;
    institutionId: string;
}) {
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !city.trim()) return toast.error('Nombre y ciudad son obligatorios');
        try {
            setSaving(true);
            const idToken = await getAuth().currentUser?.getIdToken();
            if (!idToken) { toast.error('Sesión expirada. Vuelve a iniciar sesión.'); return; }

            // El límite de sedes por plan se valida EN EL SERVIDOR.
            const res = await fetch('/api/admin/sedes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ name: name.trim(), city: city.trim(), address: address.trim() || undefined }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data?.error || 'Error al crear la sede'); return; }

            const newSede: SedeModel = {
                id: data.id,
                institutionId,
                name: name.trim(),
                city: city.trim(),
                address: address.trim() || undefined,
                isActive: true,
            };
            onCreated(newSede);
            toast.success('Sede creada exitosamente');
        } catch (err) {
            console.error(err);
            toast.error('Error al crear la sede');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        height: 44,
        padding: '0 14px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        fontSize: 14,
        outline: 'none',
        background: 'var(--muted)',
        color: 'var(--foreground)',
        boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 6,
        display: 'block',
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(6,11,46,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 999, backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: 32, width: '100%', maxWidth: 460,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Nueva Sede</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Registra un nuevo punto de operación</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Nombre de la sede *</label>
                        <input
                            style={inputStyle}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Sede Norte, Campus Central..."
                            autoFocus
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Ciudad *</label>
                        <input
                            style={inputStyle}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ej: Bogotá, Medellín..."
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Dirección (opcional)</label>
                        <input
                            style={inputStyle}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ej: Calle 72 #10-07"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--border)',
                                background: 'var(--muted)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                flex: 1, height: 44, borderRadius: 10, border: 'none',
                                background: 'var(--brand)', color: 'var(--text-on-brand)', fontWeight: 700, fontSize: 14,
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                            }}
                        >
                            {saving ? 'Creando...' : 'Crear Sede'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminSedesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [sedes, setSedes] = useState<SedeModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [planType, setPlanType] = useState<string>('starter');

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [sedesSnap, instSnap] = await Promise.all([
                    getDocs(query(
                        collection(db, 'sedes'),
                        where('institutionId', '==', institutionId),
                    )),
                    getDoc(doc(db, 'institutions', institutionId)),
                ]);
                const sedesList = sedesSnap.docs.map(d => ({ ...d.data(), id: d.id } as SedeModel));
                setSedes(sedesList);

                const instData = instSnap.data();
                if (instData?.planType) setPlanType(instData.planType.toLowerCase().trim());
            } catch (err) {
                console.error('Error fetching sedes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [institutionId, authLoading]);

    const sedeLimit = getPlanLimit(planType);
    const limitReached = sedeLimit !== -1 && sedes.length >= sedeLimit;

    const filtered = sedes.filter(s =>
        searchTerm === '' ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.adminName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            key: 'name',
            label: 'Sede',
            render: (_: any, row: SedeModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, background: 'var(--muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)',
                    }}>
                        <Building2 size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 15 }}>{row.name}</div>
                        {row.address && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.address}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'city',
            label: 'Ciudad',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    {val}
                </div>
            ),
        },
        {
            key: 'adminName',
            label: 'Admin de Sede',
            render: (val: any) => val ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{val}</span>
                </div>
            ) : (
                <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: 'var(--muted)', color: 'var(--text-muted)', letterSpacing: '0.04em',
                }}>
                    SIN ASIGNAR
                </span>
            ),
        },
        {
            key: 'isActive',
            label: 'Estado',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: val ? '#10B981' : 'var(--border-strong)' }} />
                    <span style={{
                        fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em',
                        background: val ? '#DCFCE7' : 'var(--muted)',
                        color: val ? '#166534' : 'var(--text-secondary)',
                    }}>
                        {val ? 'ACTIVA' : 'INACTIVA'}
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

    const limitLabel = sedeLimit === -1 ? 'Ilimitadas' : `${sedes.length} / ${sedeLimit}`;
    const limitPct = sedeLimit === -1 ? 0 : Math.min((sedes.length / sedeLimit) * 100, 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión de Sedes" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Sedes Institucionales"
                    subtitle={`Administra los puntos de operación y sus equipos de trabajo (${sedes.length} sedes registradas)`}
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button
                            onClick={() => {
                                if (limitReached) return toast.error(`Tu plan ${planType} permite máximo ${sedeLimit} sedes. Actualiza para agregar más.`);
                                setShowModal(true);
                            }}
                            style={{
                                padding: '10px 20px', borderRadius: 12,
                                background: limitReached ? 'var(--muted)' : 'var(--brand)',
                                color: limitReached ? 'var(--text-secondary)' : 'var(--text-on-brand)',
                                border: limitReached ? '1px solid var(--border)' : 'none',
                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: limitReached ? 'none' : '0 4px 12px rgba(24, 0, 173, 0.2)',
                            }}
                        >
                            <Plus size={16} /> Nueva Sede
                        </button>
                    }
                />

                {/* Plan usage bar */}
                {sedeLimit !== -1 && (
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                        padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20,
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    Sedes usadas (plan {planType.charAt(0).toUpperCase() + planType.slice(1)})
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: limitReached ? '#DC2626' : 'var(--foreground)' }}>
                                    {limitLabel}
                                </span>
                            </div>
                            <div style={{ height: 6, borderRadius: 99, background: 'var(--muted)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 99,
                                    width: `${limitPct}%`,
                                    background: limitReached ? '#DC2626' : limitPct > 70 ? '#F59E0B' : 'var(--brand)',
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>
                        {limitReached && (
                            <button
                                onClick={() => router.push('/admin/tienda')}
                                style={{
                                    padding: '8px 16px', borderRadius: 10, background: 'var(--brand)',
                                    color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                            >
                                Mejorar plan
                            </button>
                        )}
                    </div>
                )}

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, ciudad o admin..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14,
                                    border: '1px solid var(--border)', fontSize: 14, outline: 'none',
                                    background: 'var(--muted)', color: 'var(--foreground)',
                                }}
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        onRowClick={(row) => router.push(`/admin/sedes/${row.id}`)}
                        emptyMessage="No hay sedes registradas. Crea la primera sede de tu institución."
                    />
                </div>
            </div>

            {showModal && institutionId && (
                <CreateSedeModal
                    institutionId={institutionId}
                    onClose={() => setShowModal(false)}
                    onCreated={(sede) => {
                        setSedes(prev => [...prev, sede]);
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}
