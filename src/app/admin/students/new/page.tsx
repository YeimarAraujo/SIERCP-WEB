'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/shared/lib/firebase';
import { 
    UserPlus, Mail, Shield, Save, X, 
    User, Fingerprint, MapPin, Phone, Key,
    BookOpen, ShieldCheck, GraduationCap
} from 'lucide-react';

export default function NewStudentPage() {
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
        institutionId: 'SIERCP-GENERAL',
        role: 'ESTUDIANTE' as const,
        isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            setLoading(true);
            if (!auth || !db) throw new Error('Firebase not configured');

            const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await setDoc(doc(db, 'users', cred.user.uid), {
                uid: cred.user.uid,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: 'ESTUDIANTE',
                identificacion: formData.identificacion,
                isActive: formData.isActive,
                institutionId: formData.institutionId,
                status: 'ACTIVE',
                stats: {
                    totalSessions: 0, sessionsToday: 0, averageScore: 0, bestScore: 0,
                    streakDays: 0, totalHours: 0, averageDepthMm: 0, averageRatePerMin: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            router.push('/admin/students');
        } catch (error: any) {
            setError(error.message || 'Error al crear estudiante');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Registro Académico" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero 
                        title="Nuevo Expediente Estudiantil" 
                        subtitle="Alta de alumnos en la plataforma institucional y asignación de credenciales"
                        parentTitle="Alumnos"
                        parentHref="/admin/students"
                    />

                    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gap: 32 }}>
                            
                            {/* Sección: Información Personal */}
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <User size={20} style={{ color: '#1800AD' }} /> Datos Personales
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Nombres" icon={User} placeholder="Ej. Juan Andrés" required value={formData.firstName} onChange={(v: any) => setFormData({...formData, firstName: v})} />
                                    <FormInput label="Apellidos" icon={User} placeholder="Ej. Pérez García" required value={formData.lastName} onChange={(v: any) => setFormData({...formData, lastName: v})} />
                                    <FormInput label="Identificación (C.C.)" icon={Fingerprint} placeholder="1.000.000.000" required value={formData.identificacion} onChange={(v: any) => setFormData({...formData, identificacion: v})} />
                                    <FormInput label="Teléfono" icon={Phone} placeholder="+57 300 000 0000" value={formData.phone} onChange={(v: any) => setFormData({...formData, phone: v})} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: '#F1F5F9' }} />

                            {/* Sección: Acceso */}
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Mail size={20} style={{ color: '#1800AD' }} /> Credenciales de Acceso
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                                    <FormInput label="Correo Electrónico Institucional" icon={Mail} placeholder="estudiante@siercp.edu.co" required type="email" value={formData.email} onChange={(v: any) => setFormData({...formData, email: v})} />
                                    <FormInput label="Contraseña Temporal" icon={Key} placeholder="••••••••" required type="password" value={formData.password} onChange={(v: any) => setFormData({...formData, password: v})} />
                                </div>
                                <div style={{ marginTop: 16, padding: '12px 16px', background: '#F0F9FF', borderRadius: 12, border: '1px solid #B9E6FE', color: '#0369A1', fontSize: 12, fontWeight: 600 }}>
                                    Se enviará un correo de bienvenida con las instrucciones de activación de cuenta.
                                </div>
                            </div>

                            {error && (
                                <div style={{ padding: '12px 16px', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
                                    {error}
                                </div>
                            )}
                                    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                <button 
                                    type="button" 
                                    onClick={() => router.back()}
                                    style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        flex: 2, padding: '16px', borderRadius: 16, background: '#1800AD', color: '#FFFFFF', 
                                        border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    <Save size={20} /> {loading ? 'REGISTRANDO...' : 'CREAR EXPEDIENTE'}
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
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
                        border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 15, 
                        color: '#1E293B', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                    }} 
                />
            </div>
        </div>
    );
}
