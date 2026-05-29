'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, getSecondaryAuth } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    Users, Plus, Search, X, Pencil, Trash2, ShieldOff,
    ShieldCheck, ChevronDown, User, Mail, Phone, Hash,
    Building2, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

const ROLES = ['USUARIO', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] as const;
type Role = typeof ROLES[number];

interface UserRow {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    status: string;
    isActive: boolean;
    institutionId?: string;
    identification?: string;
    phoneNumber?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; bg: string; color: string }> = {
    USUARIO: { label: 'Usuario', bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
    INSTRUCTOR: { label: 'Instructor', bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9' },
    ADMIN: { label: 'Admin', bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
    SUPER_ADMIN: { label: 'Super Admin', bg: 'rgba(234,88,12,0.1)', color: '#ea580c' },
};

function RoleBadge({ role }: { role: Role }) {
    const m = ROLE_META[role] ?? ROLE_META.USUARIO;
    return (
        <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
            background: m.bg, color: m.color, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{m.label}</span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
            background: active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: active ? '#10b981' : '#ef4444',
            letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{active ? 'ACTIVO' : 'INACTIVO'}</span>
    );
}

// ── Modal: Crear / Editar usuario ─────────────────────────────────────────────

interface UserFormData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    identification: string;
    phoneNumber: string;
    institutionId: string;
}

const EMPTY_FORM: UserFormData = {
    email: '', password: '', firstName: '', lastName: '',
    role: 'USUARIO', identification: '', phoneNumber: '', institutionId: '',
};

interface UserModalProps {
    user: UserRow | null;
    onClose: () => void;
    onSaved: () => void;
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
    const isEdit = !!user;
    const [form, setForm] = useState<UserFormData>(
        user
            ? { ...EMPTY_FORM, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, identification: user.identification ?? user.uid ?? '', phoneNumber: user.phoneNumber ?? '', institutionId: user.institutionId ?? '' }
            : EMPTY_FORM,
    );
    const [saving, setSaving] = useState(false);

    const f = (k: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                await updateDoc(doc(db, 'users', user!.uid), {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    role: form.role,
                    identification: form.identification,
                    phoneNumber: form.phoneNumber,
                    institutionId: form.institutionId || user!.uid,
                    updatedAt: serverTimestamp(),
                });
                toast.success('Usuario actualizado');
            } else {
                const secondaryAuth = getSecondaryAuth();
                if (!secondaryAuth) throw new Error('Auth no disponible');
                const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
                await signOut(secondaryAuth);
                await setDoc(doc(db, 'users', cred.user.uid), {
                    uid: cred.user.uid,
                    email: form.email,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    role: form.role,
                    identification: form.identification,
                    phoneNumber: form.phoneNumber,
                    institutionId: form.institutionId || cred.user.uid,
                    isActive: true,
                    status: 'ACTIVE',
                    certVerification: 'NONE',
                    coursesCreated: 0,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast.success('Usuario creado');
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={onClose} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 1000, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
                background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20,
                boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {isEdit ? 'Editar usuario' : 'Crear nuevo usuario'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSave} style={{ padding: 24, display: 'grid', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Nombre *" icon={User}>
                            <input value={form.firstName} onChange={f('firstName')} required placeholder="Juan" style={inputSt} />
                        </Field>
                        <Field label="Apellido *" icon={User}>
                            <input value={form.lastName} onChange={f('lastName')} required placeholder="Pérez" style={inputSt} />
                        </Field>
                    </div>
                    {!isEdit && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <Field label="Email *" icon={Mail}>
                                <input type="email" value={form.email} onChange={f('email')} required placeholder="usuario@email.com" style={inputSt} />
                            </Field>
                            <Field label="Contraseña *" icon={Shield}>
                                <input type="password" value={form.password} onChange={f('password')} required placeholder="••••••••" minLength={6} style={inputSt} />
                            </Field>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Cédula / ID" icon={Hash}>
                            <input value={form.identification} onChange={f('identification')} placeholder="1.000.000.000" style={inputSt} />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input value={form.phoneNumber} onChange={f('phoneNumber')} placeholder="+57 300 000 0000" style={inputSt} />
                        </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Rol *" icon={Shield}>
                            <select value={form.role} onChange={f('role')} style={inputSt}>
                                {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                            </select>
                        </Field>
                        <Field label="ID Institución" icon={Building2}>
                            <input value={form.institutionId} onChange={f('institutionId')} placeholder="ID o dejar vacío" style={inputSt} />
                        </Field>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={saving} style={btnPrimary}>
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminUsuariosPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | ''>('');
    const [modal, setModal] = useState<'create' | UserRow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
            setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRow)));
        } catch {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (u: UserRow) => {
        try {
            await updateDoc(doc(db, 'users', u.uid), { isActive: !u.isActive, updatedAt: serverTimestamp() });
            setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, isActive: !x.isActive } : x));
            toast.success(`Usuario ${!u.isActive ? 'activado' : 'desactivado'}`);
        } catch { toast.error('Error al cambiar estado'); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteDoc(doc(db, 'users', confirmDelete.uid));
            setUsers(prev => prev.filter(x => x.uid !== confirmDelete.uid));
            toast.success('Usuario eliminado');
        } catch { toast.error('Error al eliminar'); }
        setConfirmDelete(null);
    };

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchQ = !q || `${u.firstName} ${u.lastName} ${u.email} ${u.identification ?? u.uid ?? ''}`.toLowerCase().includes(q);
        const matchR = !roleFilter || u.role === roleFilter;
        return matchQ && matchR;
    });

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header title="Usuarios" />
            <PageHero
                title="Gestión de usuarios"
                subtitle="Todos los usuarios registrados en la plataforma"
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
            />

            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {ROLES.map(r => {
                    const count = users.filter(u => u.role === r).length;
                    const m = ROLE_META[r];
                    return (
                        <div key={r} style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{count}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{m.label}</div>
                        </div>
                    );
                })}
                <div style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{users.filter(u => u.isActive).length}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Activos</div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o cédula…"
                        style={{ ...inputSt, paddingLeft: 36, width: '100%' }}
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | '')} style={{ ...inputSt, paddingRight: 28, appearance: 'none' }}>
                        <option value="">Todos los roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
                <button onClick={() => setModal('create')} style={btnPrimary}>
                    <Plus size={15} /> Crear usuario
                </button>
            </div>

            {/* Table */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                            {['Usuario', 'Email', 'Cédula', 'Rol', 'Estado', 'Institución', 'Acciones'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Sin resultados</td></tr>
                        ) : filtered.map((u, i) => (
                            <tr key={u.uid} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <td style={tdSt}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                                </td>
                                <td style={tdSt}><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</span></td>
                                <td style={tdSt}><span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.identification || u.uid || '—'}</span></td>
                                <td style={tdSt}><RoleBadge role={u.role as Role} /></td>
                                <td style={tdSt}><StatusBadge active={u.isActive} /></td>
                                <td style={tdSt}><span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{u.institutionId || '—'}</span></td>
                                <td style={tdSt}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <ActionBtn icon={Pencil} title="Editar" onClick={() => setModal(u)} />
                                        <ActionBtn icon={u.isActive ? ShieldOff : ShieldCheck} title={u.isActive ? 'Desactivar' : 'Activar'} onClick={() => toggleActive(u)} color={u.isActive ? '#f59e0b' : '#10b981'} />
                                        <ActionBtn icon={Trash2} title="Eliminar" onClick={() => setConfirmDelete(u)} color="#ef4444" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} usuario{filtered.length !== 1 ? 's' : ''} · Total {users.length}</div>

            {/* Modal crear/editar */}
            {(modal === 'create' || (modal && typeof modal !== 'string')) && (
                <UserModal
                    user={modal === 'create' ? null : modal as UserRow}
                    onClose={() => setModal(null)}
                    onSaved={load}
                />
            )}

            {/* Confirm delete */}
            {confirmDelete && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={() => setConfirmDelete(null)} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        zIndex: 1000, background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: 18, padding: 28, maxWidth: 400, width: '90%',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                    }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>¿Eliminar usuario?</h3>
                        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                            Esta acción eliminará el documento de <strong>{confirmDelete.firstName} {confirmDelete.lastName}</strong> de Firestore. La cuenta de Auth no se elimina automáticamente.
                        </p>
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

// ── Shared micro-components ────────────────────────────────────────────────────

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                <Icon size={11} style={{ marginRight: 4 }} />{label}
            </label>
            {children}
        </div>
    );
}

function ActionBtn({ icon: Icon, title, onClick, color = 'var(--text-muted)' }: { icon: typeof Pencil; title: string; onClick: () => void; color?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-surface-2)', cursor: 'pointer', color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
        >
            <Icon size={13} />
        </button>
    );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
    height: 38, padding: '0 12px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
    width: '100%', outline: 'none',
};

const tdSt: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' };

const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer',
    whiteSpace: 'nowrap',
};

const btnSecondary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', cursor: 'pointer',
};
