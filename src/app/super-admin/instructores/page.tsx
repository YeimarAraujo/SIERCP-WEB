'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    GraduationCap, Search, Pencil, Trash2, ShieldOff, ShieldCheck,
    CheckCircle2, XCircle, Clock, ChevronDown, X, User, Mail, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type CertStatus = 'NONE' | 'pending' | 'approved' | 'rejected';

interface InstructorRow {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    certVerification: CertStatus;
    institutionId?: string;
    identification?: string;
    phoneNumber?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CERT_META: Record<CertStatus, { label: string; bg: string; color: string; icon: typeof Clock }> = {
    NONE:     { label: 'Sin cert.',   bg: 'rgba(100,116,139,0.1)', color: '#64748b', icon: Clock },
    pending:  { label: 'Pendiente',  bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', icon: Clock },
    approved: { label: 'Aprobado',   bg: 'rgba(16,185,129,0.1)',  color: '#10b981', icon: CheckCircle2 },
    rejected: { label: 'Rechazado',  bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', icon: XCircle },
};

function CertBadge({ status }: { status: CertStatus }) {
    const m = CERT_META[status] ?? CERT_META.NONE;
    const Icon = m.icon;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
            background: m.bg, color: m.color, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
            <Icon size={10} />{m.label}
        </span>
    );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ inst: instructor, onClose, onSaved }: { inst: InstructorRow; onClose: () => void; onSaved: () => void }) {
    const [certStatus, setCertStatus] = useState<CertStatus>(instructor.certVerification);
    const [isActive, setIsActive] = useState(instructor.isActive);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', instructor.uid), {
                certVerification: certStatus,
                isActive,
                role: certStatus === 'approved' ? 'INSTRUCTOR' : instructor.role,
                updatedAt: serverTimestamp(),
            });
            toast.success('Instructor actualizado');
            onSaved();
            onClose();
        } catch { toast.error('Error al actualizar'); }
        finally { setSaving(false); }
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={onClose} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 1000, width: '100%', maxWidth: 480,
                background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20,
                boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Editar instructor</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{instructor.firstName} {instructor.lastName}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 24, display: 'grid', gap: 18 }}>
                    {/* Cert status */}
                    <div>
                        <label style={labelSt}>Estado de certificación</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                            {(Object.keys(CERT_META) as CertStatus[]).map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setCertStatus(s)}
                                    style={{
                                        padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        border: certStatus === s ? `2px solid ${CERT_META[s].color}` : '1px solid var(--border)',
                                        background: certStatus === s ? CERT_META[s].bg : 'var(--bg-surface-2)',
                                        color: certStatus === s ? CERT_META[s].color : 'var(--text-secondary)',
                                        textTransform: 'uppercase', letterSpacing: '0.04em',
                                    }}
                                >{CERT_META[s].label}</button>
                            ))}
                        </div>
                        {certStatus === 'approved' && (
                            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#10b981' }}>El rol del usuario cambiará a INSTRUCTOR al guardar.</p>
                        )}
                    </div>
                    {/* Active toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={labelSt} htmlFor="active-toggle">Cuenta activa</label>
                        <button
                            id="active-toggle"
                            type="button"
                            onClick={() => setIsActive(v => !v)}
                            style={{
                                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: isActive ? '#10b981' : 'var(--border)',
                                position: 'relative', transition: 'background 0.2s',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 3, left: isActive ? 23 : 3,
                                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }} />
                        </button>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{isActive ? 'Activo' : 'Inactivo'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={btnSecondary}>Cancelar</button>
                        <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                            {saving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminInstructoresPage() {
    const [all, setAll] = useState<InstructorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [certFilter, setCertFilter] = useState<CertStatus | ''>('');
    const [editTarget, setEditTarget] = useState<InstructorRow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<InstructorRow | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
            const rows = snap.docs
                .map(d => ({ uid: d.id, ...d.data() } as InstructorRow))
                .filter(u => u.role === 'INSTRUCTOR' || u.certVerification === 'pending');
            setAll(rows);
        } catch { toast.error('Error al cargar instructores'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (u: InstructorRow) => {
        try {
            await updateDoc(doc(db, 'users', u.uid), { isActive: !u.isActive, updatedAt: serverTimestamp() });
            setAll(prev => prev.map(x => x.uid === u.uid ? { ...x, isActive: !x.isActive } : x));
            toast.success(`Instructor ${!u.isActive ? 'activado' : 'desactivado'}`);
        } catch { toast.error('Error'); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteDoc(doc(db, 'users', confirmDelete.uid));
            setAll(prev => prev.filter(x => x.uid !== confirmDelete.uid));
            toast.success('Registro eliminado');
        } catch { toast.error('Error al eliminar'); }
        setConfirmDelete(null);
    };

    const filtered = all.filter(u => {
        const q = search.toLowerCase();
        const matchQ = !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
        const matchC = !certFilter || u.certVerification === certFilter;
        return matchQ && matchC;
    });

    const stats = {
        total: all.length,
        approved: all.filter(u => u.certVerification === 'approved').length,
        pending: all.filter(u => u.certVerification === 'pending').length,
        active: all.filter(u => u.isActive).length,
    };

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header title="Instructores" />
            <PageHero title="Gestión de instructores" subtitle="Instructores registrados y solicitudes de certificación" parentTitle="Super Admin" parentHref="/super-admin/dashboard" />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Total', value: stats.total, color: '#6366f1' },
                    { label: 'Certificados', value: stats.approved, color: '#10b981' },
                    { label: 'Pendientes', value: stats.pending, color: '#f59e0b' },
                    { label: 'Activos', value: stats.active, color: '#0ea5e9' },
                ].map(s => (
                    <div key={s.label} style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar instructor…" style={{ ...inputSt, paddingLeft: 36, width: '100%' }} />
                </div>
                <div style={{ position: 'relative' }}>
                    <select value={certFilter} onChange={e => setCertFilter(e.target.value as CertStatus | '')} style={{ ...inputSt, paddingRight: 28, appearance: 'none' }}>
                        <option value="">Todas las certificaciones</option>
                        {(Object.keys(CERT_META) as CertStatus[]).map(s => <option key={s} value={s}>{CERT_META[s].label}</option>)}
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
            </div>

            {/* Table */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                            {['Instructor', 'Email', 'Institución', 'Certificación', 'Estado', 'Acciones'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Sin resultados</td></tr>
                        ) : filtered.map((u, i) => (
                            <tr key={u.uid} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <td style={tdSt}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                                    {u.identification && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.identification}</div>}
                                </td>
                                <td style={tdSt}><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</span></td>
                                <td style={tdSt}><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.institutionId || '—'}</span></td>
                                <td style={tdSt}><CertBadge status={u.certVerification} /></td>
                                <td style={tdSt}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                                        background: u.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: u.isActive ? '#10b981' : '#ef4444',
                                        textTransform: 'uppercase', letterSpacing: '0.04em',
                                    }}>{u.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                                </td>
                                <td style={tdSt}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <ActionBtn icon={Pencil} title="Editar" onClick={() => setEditTarget(u)} />
                                        <ActionBtn icon={u.isActive ? ShieldOff : ShieldCheck} title={u.isActive ? 'Desactivar' : 'Activar'} onClick={() => toggleActive(u)} color={u.isActive ? '#f59e0b' : '#10b981'} />
                                        <ActionBtn icon={Trash2} title="Eliminar" onClick={() => setConfirmDelete(u)} color="#ef4444" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} instructor{filtered.length !== 1 ? 'es' : ''} · Total {all.length}</div>

            {editTarget && <EditModal inst={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />}

            {confirmDelete && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={() => setConfirmDelete(null)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 800 }}>¿Eliminar instructor?</h3>
                        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>Se eliminará el registro de <strong>{confirmDelete.firstName} {confirmDelete.lastName}</strong>.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmDelete(null)} style={btnSecondary}>Cancelar</button>
                            <button onClick={handleDelete} style={{ ...btnPrimary, background: '#ef4444' }}>Eliminar</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Micro-components & styles ─────────────────────────────────────────────────

function ActionBtn({ icon: Icon, title, onClick, color = 'var(--text-muted)' }: { icon: typeof Pencil; title: string; onClick: () => void; color?: string }) {
    return (
        <button onClick={onClick} title={title} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}>
            <Icon size={13} />
        </button>
    );
}

const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const inputSt: React.CSSProperties = { height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, width: '100%', outline: 'none' };
const tdSt: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' };
