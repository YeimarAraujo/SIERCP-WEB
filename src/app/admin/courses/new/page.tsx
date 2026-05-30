'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { collection, doc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import {
    Save, BookOpen, Type,
    Hash, Users, Award, AlignLeft,
    Layers, ArrowLeft, CheckCircle, Plus, Search, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ModuleFormCard, DEFAULT_MODULE, type ModuleForm } from '@/components/course/module-form-card';

interface PersonRow { uid: string; firstName: string; lastName: string; email: string; identification: string; }

export default function NewCoursePage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const [instructors, setInstructors] = useState<PersonRow[]>([]);
    const [students, setStudents] = useState<PersonRow[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<PersonRow[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        certification: 'BLS',
        description: '',
        minScore: 85,
        inviteCode: '',
        isActive: true,
        instructorId: '',
    });
    const [modules, setModules] = useState<ModuleForm[]>([{ ...DEFAULT_MODULE, order: 1 }]);

    const institutionId = user?.institutionId ?? '';
    const setField = (key: string) => (v: string | number | boolean) =>
        setFormData(prev => ({ ...prev, [key]: v }));

    const addModule = () =>
        setModules(prev => [...prev, { ...DEFAULT_MODULE, order: prev.length + 1 }]);
    const handleModuleChange = (idx: number, updated: ModuleForm) =>
        setModules(prev => prev.map((m, i) => i === idx ? updated : m));
    const removeModule = (idx: number) =>
        setModules(prev => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 })));

    useEffect(() => {
        if (authLoading || !institutionId) { setLoading(false); return; }

        const fetchPeople = async () => {
            try {
                const memSnap = await getDocs(query(
                    collection(db, 'memberships'),
                    where('institutionId', '==', institutionId),
                    where('isActive', '==', true),
                ));

                const allDocs = await Promise.all(
                    memSnap.docs.map(async m => {
                        const uDoc = await getDoc(doc(db, 'users', m.data().userId));
                        if (!uDoc.exists()) return null;
                        return { ...uDoc.data(), uid: uDoc.id, role: m.data().role } as any;
                    })
                );
                const valid = allDocs.filter(Boolean) as any[];
                setInstructors(valid.filter(u => u.role === 'INSTRUCTOR'));
                setStudents(valid.filter(u => ['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL'].includes(u.role || u.role)));
            } catch (err) {
                console.error('Error fetching people:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPeople();
    }, [institutionId, authLoading]);

    const toggleStudent = (s: PersonRow) => {
        setSelectedStudents(prev =>
            prev.find(p => p.uid === s.uid)
                ? prev.filter(p => p.uid !== s.uid)
                : [...prev, s]
        );
    };

    const filteredStudents = students.filter(s =>
        studentSearch === '' ||
        `${s.firstName} ${s.lastName} ${s.identification} ${s.email}`.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            setLoading(true);
            const { getAuth } = await import('firebase/auth');
            const idToken = await getAuth().currentUser?.getIdToken();
            if (!idToken) throw new Error('No autenticado');

            const validModules = modules
                .filter(m => m.title.trim())
                .map(m => ({ ...m, topics: m.topics.filter(Boolean) }));

            const res = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    certification: formData.certification,
                    minScore: formData.minScore,
                    inviteCode: formData.inviteCode || undefined,
                    isActive: formData.isActive,
                    instructorId: formData.instructorId || undefined,
                    modules: validModules,
                    studentIds: selectedStudents.map(s => s.uid),
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Error al crear el curso');

            toast.success(`Curso creado${selectedStudents.length > 0 ? ` con ${selectedStudents.length} estudiante(s) inscrito(s)` : ''}`);
            router.push(`/admin/courses/${result.courseId}`);
        } catch (err: any) {
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
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <PageHero
                        title="Crear Nuevo Curso"
                        subtitle="Configura el programa de capacitación, sus módulos y estudiantes"
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

                            {/* ── Información del Programa ─────────────────── */}
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <BookOpen size={20} style={{ color: 'var(--brand)' }} /> Información del Programa
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Título del Curso" icon={Type} placeholder="Ej. RCP Básico para Adultos" required value={formData.title} onChange={(v: string) => setField('title')(v)} />
                                    <FormInput label="Certificación" icon={Award} placeholder="BLS" value={formData.certification} onChange={(v: string) => setField('certification')(v)} />
                                    <FormInput label="Puntaje Mínimo (%)" icon={Hash} type="number" value={String(formData.minScore)} onChange={(v: string) => setField('minScore')(Number(v) || 85)} />
                                    <div>
                                        <label style={labelStyle}>Módulos</label>
                                        <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
                                            {modules.length} módulo{modules.length !== 1 ? 's' : ''} · auto-calculado
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <FormInput label="Descripción" icon={AlignLeft} placeholder="Breve descripción del contenido del curso..." value={formData.description} onChange={(v: string) => setField('description')(v)} />
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            {/* ── Plan de Estudios ─────────────────────────── */}
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Layers size={20} style={{ color: 'var(--brand)' }} /> Plan de Estudios (Módulos)
                                </h3>
                                {modules.map((mod, mIdx) => (
                                    <ModuleFormCard
                                        key={mIdx}
                                        module={mod}
                                        index={mIdx}
                                        showRemove={modules.length > 1}
                                        onChange={handleModuleChange}
                                        onRemove={removeModule}
                                    />
                                ))}
                                <button type="button" onClick={addModule} style={{
                                    width: '100%', padding: '14px', borderRadius: 14, border: '2px dashed var(--border)',
                                    background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                    <Plus size={16} /> Agregar Módulo
                                </button>
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            {/* ── Vincular Estudiantes ─────────────────────── */}
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Users size={20} style={{ color: 'var(--brand)' }} /> Vincular Estudiantes
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>— opcional</span>
                                </h3>
                                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                    Inscribe estudiantes de tu institución directamente al crear el curso.
                                </p>

                                {/* Selected chips */}
                                {selectedStudents.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                        {selectedStudents.map(s => (
                                            <span key={s.uid} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                                                borderRadius: 20, background: 'var(--accent)', border: '1px solid var(--brand)',
                                                color: 'var(--brand)', fontSize: 12, fontWeight: 700,
                                            }}>
                                                {s.firstName} {s.lastName}
                                                <button type="button" onClick={() => toggleStudent(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', padding: 0, display: 'flex' }}>
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                        <button type="button" onClick={() => setSelectedStudents([])} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                            Limpiar todos
                                        </button>
                                    </div>
                                )}

                                {/* Search */}
                                <div style={{ position: 'relative', marginBottom: 10 }}>
                                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        placeholder="Buscar por nombre, cédula o correo..."
                                        style={{ width: '100%', height: 42, padding: '0 12px 0 36px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--muted)', color: 'var(--foreground)' }}
                                    />
                                </div>

                                {/* List */}
                                <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)' }}>
                                    {students.length === 0 && (
                                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                            No hay estudiantes registrados en tu institución
                                        </div>
                                    )}
                                    {filteredStudents.length === 0 && students.length > 0 && (
                                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                            Sin resultados para "{studentSearch}"
                                        </div>
                                    )}
                                    {filteredStudents.map(s => {
                                        const isSelected = selectedStudents.some(p => p.uid === s.uid);
                                        return (
                                            <button
                                                key={s.uid}
                                                type="button"
                                                onClick={() => toggleStudent(s)}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                                    padding: '10px 16px', border: 'none', borderBottom: '1px solid var(--border)',
                                                    background: isSelected ? 'var(--accent)' : 'transparent',
                                                    cursor: 'pointer', textAlign: 'left',
                                                }}
                                            >
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: isSelected ? 'var(--brand)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#fff' : 'var(--brand)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                                                    {isSelected ? '✓' : (s.firstName?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{s.firstName} {s.lastName}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.identification ? `CC ${s.identification} · ` : ''}{s.email}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedStudents.length > 0 && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                                        {selectedStudents.length} estudiante{selectedStudents.length !== 1 ? 's' : ''} seleccionado{selectedStudents.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            <div style={{ height: 1, background: 'var(--muted)' }} />

                            {/* ── Configuración ────────────────────────────── */}
                            <div>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Hash size={20} style={{ color: 'var(--brand)' }} /> Configuración
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormInput label="Código de Invitación" icon={Hash} placeholder="Auto-generado si se deja vacío" value={formData.inviteCode} onChange={(v: string) => setField('inviteCode')(v)} />
                                    <div>
                                        <label style={labelStyle}>Instructor</label>
                                        <select
                                            value={formData.instructorId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, instructorId: e.target.value }))}
                                            style={{ width: '100%', height: 52, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--muted)', padding: '0 16px', fontSize: 15, color: 'var(--foreground)', fontWeight: 600 }}
                                        >
                                            <option value="">Sin instructor asignado</option>
                                            {instructors.map((i) => (
                                                <option key={i.uid} value={i.uid}>
                                                    {i.identification} - {i.firstName} {i.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginTop: 20 }}>
                                    <button
                                        type="button"
                                        onClick={() => setField('isActive')(!formData.isActive)}
                                        style={{
                                            padding: '12px 20px', borderRadius: 14, border: '1px solid var(--border)',
                                            background: formData.isActive ? '#DCFCE7' : 'var(--muted)',
                                            color: formData.isActive ? '#166534' : 'var(--text-secondary)',
                                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        <CheckCircle size={16} /> {formData.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </button>
                                </div>
                            </div>

                            {/* ── Botones ──────────────────────────────────── */}
                            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <ArrowLeft size={16} /> Cancelar
                                </button>
                                <button type="submit" disabled={loading} style={{
                                    flex: 2, padding: '16px', borderRadius: 16, background: 'var(--brand)', color: 'var(--text-on-brand)',
                                    border: 'none', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    boxShadow: '0 10px 15px -3px rgba(24, 0, 173, 0.3)', opacity: loading ? 0.7 : 1,
                                }}>
                                    <Save size={20} /> {loading ? 'CREANDO...' : `CREAR CURSO${selectedStudents.length > 0 ? ` (${selectedStudents.length} alumnos)` : ''}`}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
};

function FormInput({ label, icon: Icon, placeholder, required = false, type = 'text', value, onChange }: any) {
    return (
        <div>
            <label style={labelStyle}>{label} {required && <span style={{ color: '#EF4444' }}>*</span>}</label>
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
                    style={{ width: '100%', height: 52, padding: '0 16px 0 46px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 15, color: 'var(--foreground)', fontWeight: 600, outline: 'none' }}
                />
            </div>
        </div>
    );
}
