'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { collection, doc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import {
    Save, BookOpen, Type, FileText,
    Hash, Users, Award, AlignLeft, Calendar,
    Layers, ArrowLeft, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewCoursePage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        certification: 'BLS',
        description: '',
        minScore: 85,
        moduleCount: 1,
        inviteCode: '',
        isActive: true,
        instructorId: '',
        instructorName: '',
    });
    const [cohortData, setCohortData] = useState({
        scheduleLabel: 'Grupo 1',
        enrollmentStart: '',
        enrollmentEnd: '',
        classesStart: '',
        maxStudents: 30,
        priceCOP: 0,
    });

    const institutionId: string | null = user?.institutionId ?? null;

    const setField = (key: string) => (v: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [key]: v }));
    };

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        const fetchInstructors = async () => {
            try {
                const memSnap = await getDocs(query(
                    collection(db, 'memberships'),
                    where('institutionId', '==', institutionId),
                    where('role', '==', 'INSTRUCTOR'),
                    where('isActive', '==', true),
                ));

                const userDocs = await Promise.all(
                    memSnap.docs.map(m => getDoc(doc(db, 'users', m.data().userId)))
                );
                const enriched = userDocs
                    .filter(s => s.exists())
                    .map(s => ({ ...s.data(), uid: s.id }));

                setInstructors(enriched);
            } catch (err) {
                console.error('Error fetching instructors:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, [institutionId, authLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            setLoading(true);

            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error('No autenticado');

            const createTemplateRes = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    title: formData.title,
                    slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    description: formData.description || '',
                    descriptionLong: '',
                    level: 'basico',
                    modality: 'presencial',
                    duration: `${formData.moduleCount} módulos`,
                    sessions: formData.moduleCount,
                    priceCOP: cohortData.priceCOP,
                    priceUSD: 0,
                    targetAudience: '',
                    includesCertificate: true,
                    icon: 'shield',
                    objectives: [],
                    requirements: [],
                    regulations: [],
                    tags: [],
                    modules: [],
                    instructorId: formData.instructorId || undefined,
                }),
            });

            const templateResult = await createTemplateRes.json();
            if (!createTemplateRes.ok) throw new Error(templateResult.error || 'Error al crear template');

            const { templateId } = templateResult;

            const cohortRes = await fetch('/api/admin/cohorts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    templateId,
                    scheduleLabel: cohortData.scheduleLabel,
                    enrollmentStart: cohortData.enrollmentStart || undefined,
                    enrollmentEnd: cohortData.enrollmentEnd || undefined,
                    classesStart: cohortData.classesStart || undefined,
                    maxStudents: cohortData.maxStudents,
                    priceCOP: cohortData.priceCOP,
                    status: 'OPEN',
                }),
            });

            const cohortResult = await cohortRes.json();
            if (!cohortRes.ok) throw new Error(cohortResult.error || 'Error al crear cohorte');

            toast.success('Curso y grupo creados exitosamente');
            router.push('/admin/courses');

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión Académica" showBack onBack={() => router.push('/admin/courses')} />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <PageHero
                        title="Crear Nuevo Curso"
                        subtitle="Crea un programa de capacitación con su primer grupo de inscripción"
                        parentTitle="Cursos"
                        parentHref="/admin/courses"
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
                                    <BookOpen size={20} style={{ color: 'var(--brand)' }} /> Información del Programa
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Título del Curso" icon={Type} placeholder="Ej. RCP Básico para Adultos" required value={formData.title} onChange={(v: string) => setField('title')(v)} />
                                    <FormInput label="Certificación" icon={Award} placeholder="BLS" value={formData.certification} onChange={(v: string) => setField('certification')(v)} />
                                    <FormInput label="Puntaje Mínimo (%)" icon={Hash} type="number" value={String(formData.minScore)} onChange={(v: string) => setField('minScore')(Number(v) || 85)} />
                                    <FormInput label="Módulos" icon={Users} type="number" value={String(formData.moduleCount)} onChange={(v: string) => setField('moduleCount')(Number(v) || 1)} />
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <FormInput label="Descripción" icon={AlignLeft} placeholder="Breve descripción del contenido del curso..." value={formData.description} onChange={(v: string) => setField('description')(v)} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Layers size={20} style={{ color: 'var(--brand)' }} /> Primer Grupo de Inscripción
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Nombre del Grupo" icon={Calendar} placeholder="Ej. Grupo A - Martes" value={cohortData.scheduleLabel} onChange={(v: string) => setCohortData(c => ({ ...c, scheduleLabel: v }))} />
                                    <FormInput label="Cupo Máximo" icon={Users} type="number" value={String(cohortData.maxStudents)} onChange={(v: string) => setCohortData(c => ({ ...c, maxStudents: Number(v) || 30 }))} />
                                    <FormInput label="Fecha Inicio Inscripción" icon={Calendar} type="date" value={cohortData.enrollmentStart} onChange={(v: string) => setCohortData(c => ({ ...c, enrollmentStart: v }))} />
                                    <FormInput label="Fecha Fin Inscripción" icon={Calendar} type="date" value={cohortData.enrollmentEnd} onChange={(v: string) => setCohortData(c => ({ ...c, enrollmentEnd: v }))} />
                                    <FormInput label="Fecha Inicio Clases" icon={Calendar} type="date" value={cohortData.classesStart} onChange={(v: string) => setCohortData(c => ({ ...c, classesStart: v }))} />
                                    <FormInput label="Precio (COP)" icon={Award} type="number" value={String(cohortData.priceCOP)} onChange={(v: string) => setCohortData(c => ({ ...c, priceCOP: Number(v) || 0 }))} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <FileText size={20} style={{ color: 'var(--brand)' }} /> Configuración
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Código de Invitación" icon={Hash} placeholder="Auto-generado si se deja vacío" value={formData.inviteCode} onChange={(v: string) => setField('inviteCode')(v)} />
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                            Instructor
                                        </label>
                                        <select
                                            value={formData.instructorId}
                                            onChange={(e) => {
                                                const selected = instructors.find(i => i.uid === e.target.value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    instructorId: selected?.uid || '',
                                                    instructorName: selected
                                                        ? `${selected.firstName ?? ''} ${selected.lastName ?? ''}`.trim()
                                                        : '',
                                                }));
                                            }}
                                            style={{
                                                width: '100%', height: 52, borderRadius: 14,
                                                border: '1px solid var(--border)', background: 'var(--muted)',
                                                padding: '0 16px', fontSize: 15,
                                                color: 'var(--foreground)', fontWeight: 600,
                                            }}
                                        >
                                            <option value="">Selecciona un instructor</option>
                                            {instructors.map((i) => (
                                                <option key={i.uid} value={i.uid}>
                                                    {i.identification} - {i.firstName} {i.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Estado
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setField('isActive')(!formData.isActive)}
                                        style={{
                                            padding: '12px 20px', borderRadius: 14,
                                            border: '1px solid var(--border)', background: formData.isActive ? '#DCFCE7' : 'var(--muted)',
                                            color: formData.isActive ? '#166534' : 'var(--text-secondary)',
                                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        <CheckCircle size={16} /> {formData.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    <ArrowLeft size={16} style={{ marginRight: 8 }} /> Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2, padding: '16px', borderRadius: 16, background: 'var(--brand)', color: 'var(--text-on-brand)',
                                        border: 'none', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    <Save size={20} /> {loading ? 'CREANDO...' : 'CREAR CURSO Y GRUPO'}
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
                    onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
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
