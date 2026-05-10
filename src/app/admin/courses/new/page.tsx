'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import {
    Plus, Save, BookOpen, Type, FileText,
    Hash, Users, Award, AlignLeft
} from 'lucide-react';

export default function NewCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        certification: 'BLS',
        description: '',
        instructorId: '',
        instructorName: '',
        minScore: 85,
        moduleCount: 1,
        inviteCode: '',
        isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            setLoading(true);
            if (!db) throw new Error('Firebase not configured');

            const ref = doc(collection(db, 'courses'));
            const code = formData.inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase();

            await setDoc(ref, {
                ...formData,
                inviteCode: code,
                studentCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            router.push('/admin/courses');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al crear curso';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Gestión Académica" />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero
                        title="Crear Nuevo Curso"
                        subtitle="Diseño de programas de capacitación y certificación en soporte vital"
                        parentTitle="Cursos"
                        parentHref="/admin/courses"
                    />

                    {error && (
                        <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 32, padding: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gap: 32 }}>

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <BookOpen size={20} style={{ color: '#1800AD' }} /> Información del Programa
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Título del Curso" icon={Type} placeholder="Ej. RCP Básico para Adultos" required value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} />
                                    <FormInput label="Certificación" icon={Award} placeholder="BLS" value={formData.certification} onChange={(v: string) => setFormData({...formData, certification: v})} />
                                    <FormInput label="Puntaje Mínimo (%)" icon={Hash} type="number" value={String(formData.minScore)} onChange={(v: string) => setFormData({...formData, minScore: Number(v) || 85})} />
                                    <FormInput label="Módulos" icon={Users} type="number" value={String(formData.moduleCount)} onChange={(v: string) => setFormData({...formData, moduleCount: Number(v) || 1})} />
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <FormInput label="Descripción" icon={AlignLeft} placeholder="Breve descripción del contenido del curso..." value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: '#F1F5F9' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <FileText size={20} style={{ color: '#1800AD' }} /> Configuración
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Código de Invitación" icon={Hash} placeholder="Auto-generado si se deja vacío" value={formData.inviteCode} onChange={(v: string) => setFormData({...formData, inviteCode: v})} />
                                    <FormInput label="Nombre del Instructor" icon={Users} placeholder="Ej. Dr. Carlos Ruiz" value={formData.instructorName} onChange={(v: string) => setFormData({...formData, instructorName: v})} />
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Estado
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                        style={{
                                            padding: '12px 20px', borderRadius: 14,
                                            border: '1px solid #E2E8F0', background: formData.isActive ? '#DCFCE7' : '#F1F5F9',
                                            color: formData.isActive ? '#166534' : '#64748B',
                                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        {formData.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </button>
                                </div>
                            </div>

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
                                    <Save size={20} /> {loading ? 'CREANDO...' : 'CREAR CURSO'}
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
