'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    doc, getDoc, updateDoc, serverTimestamp,
    collection, query, where, getDocs, getDoc as getDocFn,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Building2, MapPin, User, Edit2, Check, X, Search, UserCheck } from 'lucide-react';
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
}

interface AdminCandidate {
    uid: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
}

function fullName(u: AdminCandidate) {
    if (u.displayName) return u.displayName;
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>{value}</span>
        </div>
    );
}

export default function SedeDetailPage() {
    const { sedeId } = useParams<{ sedeId: string }>();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [sede, setSede] = useState<SedeModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [editName, setEditName] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editAddress, setEditAddress] = useState('');

    // Assign admin flow
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [admins, setAdmins] = useState<AdminCandidate[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');
    const [assigning, setAssigning] = useState(false);

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading || !sedeId) return;

        const fetchSede = async () => {
            try {
                const snap = await getDoc(doc(db, 'sedes', sedeId));
                if (!snap.exists()) { toast.error('Sede no encontrada'); router.back(); return; }
                const data = { ...snap.data(), id: snap.id } as SedeModel;
                setSede(data);
                setEditName(data.name);
                setEditCity(data.city);
                setEditAddress(data.address || '');
            } catch (err) {
                console.error(err);
                toast.error('Error cargando sede');
            } finally {
                setLoading(false);
            }
        };

        fetchSede();
    }, [sedeId, authLoading, router]);

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editCity.trim()) return toast.error('Nombre y ciudad son obligatorios');
        try {
            setSaving(true);
            await updateDoc(doc(db, 'sedes', sedeId), {
                name: editName.trim(),
                city: editCity.trim(),
                address: editAddress.trim() || null,
                updatedAt: serverTimestamp(),
            });
            setSede(prev => prev ? { ...prev, name: editName.trim(), city: editCity.trim(), address: editAddress.trim() || undefined } : prev);
            setEditing(false);
            toast.success('Sede actualizada');
        } catch (err) {
            console.error(err);
            toast.error('Error guardando cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        if (!sede) return;
        try {
            const next = !sede.isActive;
            await updateDoc(doc(db, 'sedes', sedeId), { isActive: next, updatedAt: serverTimestamp() });
            setSede(prev => prev ? { ...prev, isActive: next } : prev);
            toast.success(next ? 'Sede activada' : 'Sede desactivada');
        } catch (err) {
            console.error(err);
            toast.error('Error cambiando estado');
        }
    };

    const openAssignModal = async () => {
        if (!institutionId) return;
        setShowAssignModal(true);
        setLoadingAdmins(true);
        try {
            const memSnap = await getDocs(query(
                collection(db, 'memberships'),
                where('institutionId', '==', institutionId),
                where('role', '==', 'ADMIN'),
                where('isActive', '==', true),
            ));
            const userDocs = await Promise.all(
                memSnap.docs.map(m => getDocFn(doc(db, 'users', m.data().userId)))
            );
            const candidates: AdminCandidate[] = userDocs
                .filter(d => d.exists())
                .map(d => ({ ...d.data(), uid: d.id } as AdminCandidate));
            setAdmins(candidates);
        } catch (err) {
            console.error(err);
            toast.error('Error cargando admins');
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleAssignAdmin = async (candidate: AdminCandidate) => {
        try {
            setAssigning(true);
            const idToken = await getAuth().currentUser?.getIdToken();
            if (!idToken) { toast.error('Sesión expirada. Vuelve a iniciar sesión.'); return; }

            // El backend crea el vínculo autoritativo (user.sedeId + membership.sedeId).
            const res = await fetch(`/api/admin/sedes/${sedeId}/admin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ userId: candidate.uid }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data?.error || 'Error asignando admin'); return; }

            const name = data.adminName || fullName(candidate);
            setSede(prev => prev ? { ...prev, adminId: candidate.uid, adminName: name } : prev);
            setShowAssignModal(false);
            toast.success(`${name} asignado como admin de esta sede`);
        } catch (err) {
            console.error(err);
            toast.error('Error asignando admin');
        } finally {
            setAssigning(false);
        }
    };

    const filteredAdmins = admins.filter(a =>
        adminSearch === '' ||
        fullName(a).toLowerCase().includes(adminSearch.toLowerCase()) ||
        a.email.toLowerCase().includes(adminSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
                <Header title="Detalle de Sede" />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    Cargando...
                </div>
            </div>
        );
    }

    if (!sede) return null;

    const inputStyle: React.CSSProperties = {
        height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)',
        fontSize: 14, outline: 'none', background: 'var(--muted)', color: 'var(--foreground)', width: '100%', boxSizing: 'border-box',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Detalle de Sede" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title={sede.name}
                    subtitle={`${sede.city}${sede.address ? ` · ${sede.address}` : ''}`}
                    parentTitle="Sedes"
                    parentHref="/admin/sedes"
                    actions={
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={handleToggleActive}
                                style={{
                                    padding: '10px 18px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-secondary)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}
                            >
                                {sede.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                            {editing ? (
                                <>
                                    <button onClick={() => { setEditing(false); setEditName(sede.name); setEditCity(sede.city); setEditAddress(sede.address || ''); }}
                                        style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <X size={15} /> Cancelar
                                    </button>
                                    <button onClick={handleSaveEdit} disabled={saving}
                                        style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: 'var(--text-on-brand)', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                                        <Check size={15} /> {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setEditing(true)}
                                    style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: 'var(--text-on-brand)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)' }}>
                                    <Edit2 size={15} /> Editar
                                </button>
                            )}
                        </div>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Info Card */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                                <Building2 size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Información de la Sede</h3>
                        </div>

                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Nombre *</label>
                                    <input style={inputStyle} value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Ciudad *</label>
                                    <input style={inputStyle} value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Dirección</label>
                                    <input style={inputStyle} value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Opcional" />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <InfoRow label="Nombre" value={sede.name} />
                                <InfoRow label="Ciudad" value={
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MapPin size={14} style={{ color: 'var(--text-muted)' }} /> {sede.city}
                                    </span>
                                } />
                                {sede.address && <InfoRow label="Dirección" value={sede.address} />}
                                <InfoRow label="Estado" value={
                                    <span style={{
                                        fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em',
                                        background: sede.isActive ? '#DCFCE7' : 'var(--muted)',
                                        color: sede.isActive ? '#166534' : 'var(--text-secondary)',
                                    }}>
                                        {sede.isActive ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                } />
                            </div>
                        )}
                    </div>

                    {/* Admin Card */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                                <User size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Admin de Sede</h3>
                        </div>

                        {sede.adminId ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontSize: 20, fontWeight: 700 }}>
                                        {(sede.adminName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 16 }}>{sede.adminName}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                            <UserCheck size={13} style={{ color: '#10B981' }} />
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Admin asignado</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={openAssignModal}
                                    style={{
                                        padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)',
                                        background: 'var(--muted)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    }}
                                >
                                    Cambiar admin
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
                                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                    Esta sede no tiene un admin asignado. Selecciona un admin de tu institución para gestionar esta sede.
                                </p>
                                <button
                                    onClick={openAssignModal}
                                    style={{
                                        padding: '10px 20px', borderRadius: 10, border: 'none',
                                        background: 'var(--brand)', color: 'var(--text-on-brand)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)',
                                    }}
                                >
                                    <UserCheck size={15} /> Asignar Admin
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Assign Admin Modal */}
            {showAssignModal && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(6,11,46,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 999, backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setShowAssignModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20,
                            padding: 28, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--foreground)' }}>Asignar Admin de Sede</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Selecciona un admin de tu institución</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar admin..."
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                                style={{ width: '100%', height: 42, padding: '0 14px 0 38px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--muted)', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {loadingAdmins ? (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>Cargando admins...</div>
                            ) : filteredAdmins.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
                                    {admins.length === 0 ? 'No hay admins en esta institución. Primero crea un admin en Usuarios.' : 'Sin resultados'}
                                </div>
                            ) : filteredAdmins.map((a) => (
                                <button
                                    key={a.uid}
                                    onClick={() => handleAssignAdmin(a)}
                                    disabled={assigning}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                                        borderRadius: 12, border: sede.adminId === a.uid ? '2px solid var(--brand)' : '1px solid var(--border)',
                                        background: sede.adminId === a.uid ? 'var(--accent)' : 'var(--card)',
                                        cursor: assigning ? 'not-allowed' : 'pointer', textAlign: 'left',
                                        opacity: assigning ? 0.7 : 1,
                                    }}
                                >
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 700, flexShrink: 0 }}>
                                        {fullName(a).charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName(a)}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>
                                    </div>
                                    {sede.adminId === a.uid && <UserCheck size={18} style={{ color: 'var(--brand)', flexShrink: 0 }} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
