'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import {
    UserPlus, User, Fingerprint, Phone, Key,
    Star, GraduationCap, Link2, Search, CheckCircle,
    AlertCircle, ArrowLeft, Mail, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import { DOCUMENT_TYPE_OPTIONS } from '@/shared/constants/document_types';

type Step = 'search' | 'found' | 'new';

interface FoundUser {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export default function NewInstructorPage() {
    const router = useRouter();
    const adminUser = useAuthStore((s) => s.user);
    const institutionId = adminUser?.institutionId ?? '';

    const [step, setStep] = useState<Step>('search');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [identification, setIdentification] = useState('');
    const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        password: '', confirmPassword: '',
        phone: '', specialty: 'Instructor de Soporte Vital',
        documentType: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const setField = (k: keyof typeof form) => (v: string) =>
        setForm((p) => ({ ...p, [k]: v }));

    const getIdToken = async () => {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('No autenticado');
        return token;
    };

    // ── Step 1: search by ID ──────────────────────────────────────────────────
    const handleSearch = async () => {
        const id = identification.trim();
        if (!id) return;
        setSearching(true);
        setError(null);
        try {
            const snap = await getDocs(
                query(collection(db, 'users'), where('identification', '==', id))
            );
            if (!snap.empty) {
                const d = snap.docs[0].data();
                setFoundUser({
                    uid: snap.docs[0].id,
                    firstName: d.firstName ?? '',
                    lastName: d.lastName ?? '',
                    email: d.email ?? '',
                    role: d.role ?? '',
                });
                setStep('found');
            } else {
                setFoundUser(null);
                setStep('new');
            }
        } catch (e: any) {
            setError(e.message || 'Error al buscar');
        } finally {
            setSearching(false);
        }
    };

    // ── Step 2a: link existing user via API (Admin SDK server-side) ───────────
    const handleLink = async () => {
        if (!foundUser) return;
        if (!institutionId) {
            setError('No se encontró el ID de tu institución. Recarga la página e intenta de nuevo.');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const idToken = await getIdToken();
            const res = await fetch('/api/admin/instructors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ action: 'link', userId: foundUser.uid }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al vincular instructor');

            toast.success('Instructor vinculado a tu institución');
            router.push('/admin/instructors');
        } catch (e: any) {
            setError(e.message || 'Error al vincular');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2b: create new instructor via API (Admin SDK server-side) ────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.documentType) {
            setError('Selecciona el tipo de documento');
            return;
        }
        if (form.password.length < 6) {
            setError('La contraseña debe tener mínimo 6 caracteres');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (!institutionId) {
            setError('No se encontró el ID de tu institución. Recarga la página e intenta de nuevo.');
            return;
        }

        setLoading(true);
        try {
            const idToken = await getIdToken();
            const res = await fetch('/api/admin/instructors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    action: 'create',
                    email: form.email,
                    password: form.password,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    documentType: form.documentType,
                    phone: form.phone,
                    specialty: form.specialty,
                    identification: identification.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear instructor');

            toast.success('Instructor registrado y vinculado exitosamente');
            router.push('/admin/instructors');
        } catch (e: any) {
            setError(e.message || 'Error al crear instructor');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión de Facultad" />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero
                        title="Agregar Instructor"
                        subtitle="Busca por cédula para vincular un instructor existente, o crea uno nuevo"
                        parentTitle="Instructores"
                        parentHref="/admin/instructors"
                    />

                    {/* ── Step 1: ID search ──────────────────────────────── */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 32, padding: 40, marginBottom: step !== 'search' ? 24 : 0 }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: 15, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Fingerprint size={18} style={{ color: 'var(--brand)' }} /> Paso 1 — Identificación
                        </h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                    <Fingerprint size={18} />
                                </div>
                                <input
                                    value={identification}
                                    onChange={(e) => { setIdentification(e.target.value); setStep('search'); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Número de cédula / documento"
                                    style={{ width: '100%', height: 52, padding: '0 16px 0 46px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 15, color: 'var(--foreground)', fontWeight: 600, outline: 'none' }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={searching || !identification.trim()}
                                style={{ height: 52, padding: '0 28px', borderRadius: 14, background: 'var(--brand)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: searching || !identification.trim() ? 0.6 : 1 }}
                            >
                                <Search size={16} /> {searching ? 'Buscando…' : 'Buscar'}
                            </button>
                        </div>
                    </div>

                    {/* ── Step 2a: user found ────────────────────────────── */}
                    {step === 'found' && foundUser && (
                        <div style={{ background: 'var(--card)', border: '1px solid #10B98140', borderRadius: 32, padding: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <CheckCircle size={22} color="#10B981" />
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#10B981' }}>
                                    Usuario encontrado en el sistema
                                </h3>
                            </div>

                            {/* User card */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'var(--muted)', borderRadius: 16, marginBottom: 24, border: '1px solid var(--border)' }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                                    {foundUser.firstName[0]?.toUpperCase()}{foundUser.lastName[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--foreground)' }}>
                                        {foundUser.firstName} {foundUser.lastName}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{foundUser.email}</div>
                                    <div style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 20, background: '#1800ad18', fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>
                                        {foundUser.role}
                                    </div>
                                </div>
                            </div>

                            {error && <ErrorBox message={error} />}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => setStep('search')} style={{ flex: 1, height: 52, borderRadius: 14, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <ArrowLeft size={16} /> Cambiar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLink}
                                    disabled={loading}
                                    style={{ flex: 2, height: 52, borderRadius: 14, background: '#10B981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
                                >
                                    <Link2 size={16} /> {loading ? 'Vinculando…' : 'Vincular como Instructor a mi Institución'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2b: new user form ─────────────────────────── */}
                    {step === 'new' && (
                        <form onSubmit={handleCreate} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 32, padding: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <AlertCircle size={20} color="#F59E0B" />
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>
                                    Paso 2 — No existe. Completa los datos para crear el instructor
                                </h3>
                            </div>

                            <div style={{ display: 'grid', gap: 24 }}>
                                {/* Perfil */}
                                <div>
                                    <SectionTitle icon={GraduationCap} label="Perfil Profesional" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <FormInput label="Nombres" icon={User} required value={form.firstName} onChange={setField('firstName')} placeholder="Carlos Mario" />
                                        <FormInput label="Apellidos" icon={User} required value={form.lastName} onChange={setField('lastName')} placeholder="Ruiz Velásquez" />
                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                                <Fingerprint size={13} style={{ marginRight: 4 }} /> Tipo doc. <span style={{ color: '#EF4444' }}>*</span>
                                            </label>
                                            <select value={form.documentType} onChange={e => setField('documentType')(e.target.value)} style={{ width: '100%', height: 50, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 14, color: 'var(--foreground)', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                                                <option value="">Seleccionar...</option>
                                                {DOCUMENT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <FormInput label="Especialidad" icon={Star} value={form.specialty} onChange={setField('specialty')} placeholder="Medicina de Urgencias" />
                                        <FormInput label="Teléfono" icon={Phone} value={form.phone} onChange={setField('phone')} placeholder="+57 300 000 0000" />
                                    </div>
                                </div>

                                <Divider />

                                {/* Acceso */}
                                <div>
                                    <SectionTitle icon={Key} label="Credenciales de Acceso" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <FormInput label="Correo Corporativo" icon={Mail} required type="email" value={form.email} onChange={setField('email')} placeholder="instructor@siercp.edu.co" />
                                        <div />
                                        <PasswordInput label="Contraseña Temporal" value={form.password} onChange={setField('password')} show={showPassword} toggleShow={() => setShowPassword(p => !p)} />
                                        <PasswordInput label="Confirmar Contraseña" value={form.confirmPassword} onChange={setField('confirmPassword')} show={showConfirmPassword} toggleShow={() => setShowConfirmPassword(p => !p)} />
                                    </div>
                                </div>

                                {error && <ErrorBox message={error} />}

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" onClick={() => setStep('search')} style={{ flex: 1, height: 52, borderRadius: 14, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <ArrowLeft size={16} /> Volver
                                    </button>
                                    <button type="submit" disabled={loading} style={{ flex: 2, height: 52, borderRadius: 14, background: 'var(--brand)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, boxShadow: '0 8px 20px -4px rgba(24,0,173,0.3)' }}>
                                        <UserPlus size={16} /> {loading ? 'Registrando…' : 'Registrar Instructor'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
    return (
        <h4 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={16} style={{ color: 'var(--brand)' }} /> {label}
        </h4>
    );
}

function Divider() {
    return <div style={{ height: 1, background: 'var(--border)' }} />;
}

function ErrorBox({ message }: { message: string }) {
    return (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {message}
        </div>
    );
}

function PasswordInput({ label, value, onChange, show, toggleShow }: {
    label: string; value: string; onChange: (v: string) => void; show: boolean; toggleShow: () => void;
}) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {label} <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Key size={17} />
                </div>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="********"
                    required
                    style={{ width: '100%', height: 50, padding: '0 44px 0 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 14, color: 'var(--foreground)', fontWeight: 600, outline: 'none' }}
                />
                <button
                    type="button"
                    onClick={toggleShow}
                    style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                    }}
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );
}

function FormInput({ label, icon: Icon, placeholder = '', required = false, type = 'text', value, onChange }: {
    label: string; icon: any; placeholder?: string; required?: boolean; type?: string; value: string; onChange: (v: string) => void;
}) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Icon size={17} />
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    style={{ width: '100%', height: 50, padding: '0 14px 0 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 14, color: 'var(--foreground)', fontWeight: 600, outline: 'none' }}
                />
            </div>
        </div>
    );
}
