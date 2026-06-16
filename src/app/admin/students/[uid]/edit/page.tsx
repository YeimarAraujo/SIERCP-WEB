'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { UserService } from '@/services/firestore.service';
import { getFullName } from '@/shared/types/user';
import type { UserModel } from '@/shared/types/user';
import { 
    User, Mail, Save, Building, Shield, Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditStudentPage() {
    const params = useParams();
    const router = useRouter();
    const uid = params.uid as string;
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        identification: '',
        institutionId: '',
        status: 'ACTIVE',
    });

    useEffect(() => {
        if (!uid) return;
        
        UserService.get(uid)
            .then((user) => {
                if (!user) {
                    router.push('/admin/students');
                    return;
                }
                const u = user as UserModel;
                setFormData({
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    email: u.email || '',
                    identification: u.identification || '',
                    institutionId: u.institutionId || '',
                    status: u.status || 'ACTIVE',
                });
            })
            .catch(() => router.push('/admin/students'))
            .finally(() => setFetching(false));
    }, [uid, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('El nombre y apellido son requeridos');
            return;
        }

        try {
            setLoading(true);
            await UserService.update(uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                identification: formData.identification,
                institutionId: formData.institutionId,
                status: formData.status as 'ACTIVE' | 'PENDING',
                updatedAt: new Date(),
            });
            
            toast.success('Estudiante actualizado exitosamente');
            router.push(`/admin/students/${uid}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar estudiante';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Editar Estudiante" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero 
                        title="Editar Estudiante" 
                        subtitle="Actualiza la información del estudiante"
                        parentTitle="Estudiantes"
                        parentHref={`/admin/students/${uid}`}
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
                                    <User size={20} style={{ color: 'var(--brand)' }} /> Información Personal
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Nombres" icon={User} placeholder="Ej. Juan Andrés" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                                    <FormInput label="Apellidos" icon={User} placeholder="Ej. Pérez García" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                                    <FormInput label="Identificación" icon={Fingerprint} placeholder="1.000.000.000" value={formData.identification} onChange={(v: string) => setFormData({...formData, identification: v})} />
                                    <FormInput label="Institución" icon={Building} placeholder="SIERCP-GENERAL" value={formData.institutionId} onChange={(v: string) => setFormData({...formData, institutionId: v})} />
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <FormInput label="Correo" icon={Mail} placeholder="correo@ejemplo.com" type="email" disabled value={formData.email} onChange={() => {}} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Shield size={20} style={{ color: 'var(--brand)' }} /> Estado de Cuenta
                                </h3>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, status: 'ACTIVE'})}
                                        style={{
                                            padding: '14px 24px', borderRadius: 14,
                                            border: '1px solid var(--border)', background: formData.status === 'ACTIVE' ? '#DCFCE7' : 'var(--muted)',
                                            color: formData.status === 'ACTIVE' ? '#166534' : 'var(--text-secondary)',
                                            fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: formData.status === 'ACTIVE' ? '#10B981' : 'var(--text-muted)' }} />
                                        ACTIVO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, status: 'PENDING'})}
                                        style={{
                                            padding: '14px 24px', borderRadius: 14,
                                            border: '1px solid var(--border)', background: formData.status === 'PENDING' ? '#FEF3C7' : 'var(--muted)',
                                            color: formData.status === 'PENDING' ? '#92400E' : 'var(--text-secondary)',
                                            fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: formData.status === 'PENDING' ? '#F59E0B' : 'var(--text-muted)' }} />
                                        PENDIENTE
                                    </button>
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
                                    <Save size={20} /> {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, icon: Icon, placeholder, required = false, type = "text", value, onChange, disabled = false }: any) {
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
                    disabled={disabled}
                    style={{ 
                        width: '100%', height: 52, padding: '0 16px 0 46px', borderRadius: 14, 
                        border: '1px solid var(--border)', background: disabled ? 'var(--muted)' : 'var(--card)', fontSize: 15, 
                        color: 'var(--foreground)', fontWeight: 600, outline: 'none', transition: 'all 0.2s',
                        opacity: disabled ? 0.7 : 1
                    }} 
                />
            </div>
        </div>
    );
}