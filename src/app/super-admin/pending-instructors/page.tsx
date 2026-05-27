'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    GraduationCap, Search, CheckCircle2, XCircle, Clock, X,
    User, Mail, Building2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PendingInstructor {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    certVerification?: string;
    institutionId?: string;
    identificacion?: string;
    phoneNumber?: string;
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({ instructor, onClose, onRejected }: {
    instructor: PendingInstructor;
    onClose: () => void;
    onRejected: (uid: string) => void;
}) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const handleReject = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/super-admin/instructors/${instructor.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', reason: reason.trim() || undefined }),
            });
            if (!res.ok) throw new Error('Error al rechazar');
            toast.success(`Instructor ${instructor.firstName} ${instructor.lastName} rechazado`);
            onRejected(instructor.uid);
            onClose();
        } catch {
            toast.error('Error al rechazar el instructor');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 440, background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 24, padding: 28, zIndex: 201, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)',
            }}>
                <div style={{ marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#ef4444' }}>
                        <XCircle size={22} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Rechazar solicitud</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>{instructor.firstName} {instructor.lastName}</strong> — {instructor.email}
                    </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Motivo del rechazo (opcional)
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ej: Documentación incompleta, certificados vencidos..."
                        style={{
                            width: '100%', height: 90, padding: '10px 14px', borderRadius: 12,
                            border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, outline: 'none',
                            background: 'var(--bg-surface-2)', color: 'var(--text-primary)',
                            resize: 'vertical', boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={btnSecondary}>Cancelar</button>
                    <button
                        onClick={handleReject}
                        disabled={saving}
                        style={{ ...btnPrimary, background: '#ef4444', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
                    >
                        {saving ? 'Rechazando...' : 'Confirmar rechazo'}
                    </button>
                </div>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PendingInstructorsPage() {
    const [instructors, setInstructors] = useState<PendingInstructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [rejectTarget, setRejectTarget] = useState<PendingInstructor | null>(null);
    const [approvingUid, setApprovingUid] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            if (!db) { setLoading(false); return; }
            const snap = await getDocs(query(collection(db, 'users'), where('certVerification', '==', 'pending')));
            const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() } as PendingInstructor));
            setInstructors(rows);
        } catch {
            toast.error('Error al cargar instructores pendientes');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleApprove = async (instructor: PendingInstructor) => {
        setApprovingUid(instructor.uid);
        try {
            const res = await fetch(`/api/super-admin/instructors/${instructor.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            });
            if (!res.ok) throw new Error('Error al aprobar');
            toast.success(`${instructor.firstName} ${instructor.lastName} aprobado como INSTRUCTOR`);
            setInstructors(prev => prev.filter(i => i.uid !== instructor.uid));
        } catch {
            toast.error('Error al aprobar el instructor');
        } finally {
            setApprovingUid(null);
        }
    };

    const handleRejected = (uid: string) =>
        setInstructors(prev => prev.filter(i => i.uid !== uid));

    const filtered = instructors.filter(u => {
        const q = search.toLowerCase();
        return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
    });

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header title="Instructores Pendientes" />
            <PageHero
                title="Solicitudes de Certificación"
                subtitle="Instructores que han subido certificados y esperan verificación"
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Pendientes', value: instructors.length,                                                      color: '#f59e0b', icon: Clock },
                    { label: 'Con cédula',  value: instructors.filter(u => !!u.identificacion).length,                    color: '#6366f1', icon: User },
                    { label: 'Con email',   value: instructors.filter(u => !!u.email).length,                             color: '#0ea5e9', icon: Mail },
                    { label: 'Con inst.',   value: instructors.filter(u => u.institutionId && u.institutionId !== u.uid).length, color: '#10b981', icon: Building2 },
                ].map(s => (
                    <div key={s.label} style={{ padding: '14px 18px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                <s.icon size={14} />
                            </div>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{loading ? '…' : s.value}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: 420 }}>
                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o email…"
                    style={{ ...inputSt, paddingLeft: 40, width: '100%' }}
                />
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <GraduationCap size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 14 }}>Cargando solicitudes…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <GraduationCap size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>
                        {search ? 'Sin coincidencias' : 'Sin solicitudes pendientes'}
                    </p>
                    <p style={{ fontSize: 13, margin: 0, opacity: 0.7 }}>
                        {search ? 'Intenta con otro término de búsqueda' : 'No hay instructores esperando aprobación de certificados'}
                    </p>
                </div>
            ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                                {['Instructor', 'Email', 'Cédula', 'Organización', 'Acciones'].map(h => (
                                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u, i) => (
                                <tr key={u.uid} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                    <td style={tdSt}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>CERTIFICACIÓN PENDIENTE</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={tdSt}><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email || '—'}</span></td>
                                    <td style={tdSt}><span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.identificacion || '—'}</span></td>
                                    <td style={tdSt}>
                                        {u.institutionId && u.institutionId !== u.uid ? (
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{u.institutionId}</span>
                                        ) : (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Independiente</span>
                                        )}
                                    </td>
                                    <td style={tdSt}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => handleApprove(u)}
                                                disabled={approvingUid === u.uid}
                                                style={{
                                                    ...btnPrimary, background: '#10b981', fontSize: 12,
                                                    padding: '7px 14px', borderRadius: 9,
                                                    opacity: approvingUid === u.uid ? 0.7 : 1,
                                                    cursor: approvingUid === u.uid ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                <CheckCircle2 size={13} />
                                                {approvingUid === u.uid ? 'Aprobando…' : 'Aprobar'}
                                            </button>
                                            <button
                                                onClick={() => setRejectTarget(u)}
                                                disabled={approvingUid === u.uid}
                                                style={{
                                                    ...btnSecondary, fontSize: 12,
                                                    padding: '7px 14px', borderRadius: 9,
                                                    color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)',
                                                }}
                                            >
                                                <XCircle size={13} />
                                                Rechazar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''} pendiente{filtered.length !== 1 ? 's' : ''} de certificación
            </div>

            {rejectTarget && (
                <RejectModal
                    instructor={rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    onRejected={handleRejected}
                />
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = { height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, outline: 'none' };
const tdSt: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap' };
