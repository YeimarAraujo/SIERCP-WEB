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
    User, Fingerprint, Award, Phone, 
    Briefcase, GraduationCap, Star, Key
} from 'lucide-react';

export default function NewInstructorPage() {
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
        specialty: 'Instructor de Soporte Vital',
        institutionId: 'SIERCP-GENERAL',
        role: 'INSTRUCTOR' as const,
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
                role: 'INSTRUCTOR',
                identificacion: formData.identificacion,
                isActive: formData.isActive,
                institutionId: formData.institutionId,
                status: 'PENDING',
                stats: {
                    totalSessions: 0, sessionsToday: 0, averageScore: 0, bestScore: 0,
                    streakDays: 0, totalHours: 0, averageDepthMm: 0, averageRatePerMin: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            router.push('/admin/instructors');
        } catch (error: any) {
            setError(error.message || 'Error al crear instructor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Gestión de Facultad" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero 
                        title="Vincular Nuevo Instructor" 
                        subtitle="Registro de personal docente y asignación de perfiles de capacitación avanzada"
                        parentTitle="Instructores"
                        parentHref="/admin/instructors"
                    />

                    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gap: 32 }}>
                            
                            {/* Sección: Perfil Profesional */}
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <GraduationCap size={20} style={{ color: '#1800AD' }} /> Perfil Profesional
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Nombres" icon={User} placeholder="Ej. Carlos Mario" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                                    <FormInput label="Apellidos" icon={User} placeholder="Ej. Ruiz Velásquez" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                                    <FormInput label="Especialidad" icon={Star} placeholder="Ej. Medicina de Urgencias" value={formData.specialty} onChange={(v: string) => setFormData({...formData, specialty: v})} />
                                    <FormInput label="Teléfono" icon={Phone} placeholder="+57 300 000 0000" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: '#F1F5F9' }} />

                            {/* Sección: Identidad y Acceso */}
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Key size={20} style={{ color: '#1800AD' }} /> Identidad Institucional
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Correo Corporativo" icon={Mail} placeholder="instructor@siercp.edu.co" required type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                                    <FormInput label="Documento Identidad" icon={Fingerprint} placeholder="C.C. 000.000.000" required value={formData.identificacion} onChange={(v: string) => setFormData({...formData, identificacion: v})} />
                                    <FormInput label="Contraseña Temporal" icon={Key} placeholder="••••••••" required type="password" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} />
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
                                    <UserPlus size={20} /> {loading ? 'VINCULANDO...' : 'REGISTRAR INSTRUCTOR'}
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
