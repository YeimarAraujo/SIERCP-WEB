'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    collection, getDocs, doc, updateDoc, deleteDoc,
    query, orderBy, serverTimestamp, collectionGroup,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    BookOpen, Search, Pencil, Trash2, Eye, EyeOff,
    ChevronDown, X, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseRow {
    id: string;
    title: string;
    description?: string;
    institutionId?: string;
    isActive: boolean;
    status?: string;
    studentsCount?: number;
    createdAt?: { toDate?: () => Date };
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ course, onClose, onSaved }: { course: CourseRow; onClose: () => void; onSaved: () => void }) {
    const [title, setTitle] = useState(course.title);
    const [description, setDescription] = useState(course.description ?? '');
    const [isActive, setIsActive] = useState(course.isActive);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'courses', course.id), {
                title, description, isActive, updatedAt: serverTimestamp(),
            });
            toast.success('Curso actualizado');
            onSaved();
            onClose();
        } catch { toast.error('Error al actualizar'); }
        finally { setSaving(false); }
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={onClose} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, width: '100%', maxWidth: 500, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Editar curso</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 24, display: 'grid', gap: 16 }}>
                    <div>
                        <label style={labelSt}>Título *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputSt, marginTop: 6 }} required />
                    </div>
                    <div>
                        <label style={labelSt}>Descripción</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                            style={{ ...inputSt, marginTop: 6, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={labelSt}>Activo</label>
                        <button type="button" onClick={() => setIsActive(v => !v)}
                            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: isActive ? '#10b981' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                            <span style={{ position: 'absolute', top: 3, left: isActive ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                        <button onClick={onClose} style={btnSecondary}>Cancelar</button>
                        <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? 'Guardando…' : 'Guardar'}</button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminCursosPage() {
    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [editTarget, setEditTarget] = useState<CourseRow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<CourseRow | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc')));
            setCourses(snap.docs.map(d => ({ id: d.id, isActive: true, ...d.data() } as CourseRow)));
        } catch { toast.error('Error al cargar cursos'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (c: CourseRow) => {
        try {
            await updateDoc(doc(db, 'courses', c.id), { isActive: !c.isActive, updatedAt: serverTimestamp() });
            setCourses(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x));
            toast.success(`Curso ${!c.isActive ? 'activado' : 'desactivado'}`);
        } catch { toast.error('Error'); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteDoc(doc(db, 'courses', confirmDelete.id));
            setCourses(prev => prev.filter(x => x.id !== confirmDelete.id));
            toast.success('Curso eliminado');
        } catch { toast.error('Error al eliminar'); }
        setConfirmDelete(null);
    };

    const filtered = courses.filter(c => {
        const q = search.toLowerCase();
        const matchQ = !q || (c.title ?? '').toLowerCase().includes(q) || (c.institutionId ?? '').toLowerCase().includes(q);
        const matchS = statusFilter === 'all' || (statusFilter === 'active' ? c.isActive : !c.isActive);
        return matchQ && matchS;
    });

    const stats = {
        total: courses.length,
        active: courses.filter(c => c.isActive).length,
        inactive: courses.filter(c => !c.isActive).length,
    };

    function fmtDate(ts: CourseRow['createdAt']) {
        if (!ts?.toDate) return '—';
        return ts.toDate().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header title="Cursos" />
            <PageHero title="Gestión de cursos" subtitle="Todos los cursos de instituciones en la plataforma" parentTitle="Super Admin" parentHref="/super-admin/dashboard" />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Total cursos', value: stats.total, color: '#6366f1' },
                    { label: 'Activos', value: stats.active, color: '#10b981' },
                    { label: 'Inactivos', value: stats.inactive, color: '#64748b' },
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
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título o institución…" style={{ ...inputSt, paddingLeft: 36, width: '100%' }} />
                </div>
                <div style={{ position: 'relative' }}>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} style={{ ...inputSt, paddingRight: 28, appearance: 'none' }}>
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
            </div>

            {/* Table */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                            {['Curso', 'Institución', 'Estado', 'Creado', 'Acciones'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Sin resultados</td></tr>
                        ) : filtered.map((c, i) => (
                            <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <td style={tdSt}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{c.title || '(Sin título)'}</div>
                                    {c.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>}
                                </td>
                                <td style={tdSt}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                                        <Building2 size={12} />{c.institutionId || '—'}
                                    </span>
                                </td>
                                <td style={tdSt}>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: c.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: c.isActive ? '#10b981' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {c.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td style={tdSt}><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(c.createdAt)}</span></td>
                                <td style={tdSt}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <ActionBtn icon={Pencil} title="Editar" onClick={() => setEditTarget(c)} />
                                        <ActionBtn icon={c.isActive ? EyeOff : Eye} title={c.isActive ? 'Desactivar' : 'Activar'} onClick={() => toggleActive(c)} color={c.isActive ? '#f59e0b' : '#10b981'} />
                                        <ActionBtn icon={Trash2} title="Eliminar" onClick={() => setConfirmDelete(c)} color="#ef4444" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} curso{filtered.length !== 1 ? 's' : ''} · Total {courses.length}</div>

            {editTarget && <EditModal course={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />}

            {confirmDelete && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={() => setConfirmDelete(null)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 800 }}>¿Eliminar curso?</h3>
                        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>Se eliminará <strong>{confirmDelete.title}</strong> permanentemente.</p>
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
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' };
