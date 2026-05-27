'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, getSecondaryAuth } from '@/shared/lib/firebase';
import { ROLE_STUDENT, ROLE_INSTRUCTOR } from '@/shared/lib/constants';
import {
    UserPlus, Mail, Shield, Save,
    User, Fingerprint, Phone, Key,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        identificacion: '',
        phone: '',
        role: 'USUARIO' as string,
        institutionId: 'SIERCP-GENERAL',
        isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            setLoading(true);

            if (!db) throw new Error('Firebase not configured');

            const secondaryAuth = getSecondaryAuth();
            if (!secondaryAuth) throw new Error('Auth no disponible');
            const cred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
            await signOut(secondaryAuth);

            await setDoc(doc(db, 'users', cred.user.uid), {
                uid: cred.user.uid,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
                identificacion: formData.identificacion,
                isActive: formData.isActive,
                institutionId: formData.institutionId,
                status: formData.role === ROLE_INSTRUCTOR ? 'PENDING' : 'ACTIVE',
                stats: {
                    totalSessions: 0,
                    sessionsToday: 0,
                    averageScore: 0,
                    bestScore: 0,
                    streakDays: 0,
                    totalHours: 0,
                    averageDepthMm: 0,
                    averageRatePerMin: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success('Usuario creado exitosamente');
            router.push('/admin/users');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al crear usuario';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión de Usuarios" />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero
                        title="Crear Nuevo Usuario"
                        subtitle="Registro de perfiles con credenciales de acceso y asignación de roles"
                        parentTitle="Usuarios"
                        parentHref="/admin/users"
                    />

                    {error && (
                        <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gap: 32 }}>

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <User size={20} style={{ color: 'var(--brand)' }} /> Datos Personales
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Nombres" icon={User} placeholder="Ej. Juan Andrés" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                                    <FormInput label="Apellidos" icon={User} placeholder="Ej. Pérez García" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                                    <FormInput label="Identificación" icon={Fingerprint} placeholder="C.C. 1.000.000.000" value={formData.identificacion} onChange={(v: string) => setFormData({...formData, identificacion: v})} />
                                    <FormInput label="Teléfono" icon={Phone} placeholder="+57 300 000 0000" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Mail size={20} style={{ color: 'var(--brand)' }} /> Credenciales y Rol
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Correo Electrónico" icon={Mail} placeholder="usuario@siercp.edu.co" required type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                                    <FormInput label="Contraseña" icon={Key} placeholder="••••••••" required type="password" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} />
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Rol <span style={{ color: '#EF4444' }}>*</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {[
                                            { value: 'USUARIO', label: 'Usuario', icon: User },
                                            { value: 'INSTRUCTOR', label: 'Instructor', icon: Shield },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData({...formData, role: opt.value})}
                                                style={{
                                                    flex: 1, padding: '14px 20px', borderRadius: 14,
                                                    border: formData.role === opt.value ? '2px solid var(--brand)' : '1px solid var(--border)',
                                                    background: formData.role === opt.value ? '#F5F3FF' : 'var(--muted)',
                                                    color: formData.role === opt.value ? 'var(--brand)' : 'var(--text-secondary)',
                                                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <opt.icon size={18} /> {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2, padding: '16px', borderRadius: 16, background: 'var(--brand)', color: 'var(--text-on-brand)',
                                        border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    <UserPlus size={20} /> {loading ? 'CREANDO...' : 'CREAR USUARIO'}
                                </button>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, icon: Icon, placeholder, required = false, type = "text", value, onChange }: any) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Icon size={18} />
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    style={{
                        width: '100%', height: 52, padding: '0 16px 0 46px', borderRadius: 14,
                        border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 15,
                        color: 'var(--foreground)', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                    }}
                />
            </div>
        </div>
    );
}
