'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowLeft, AlertCircle, Plus, Layers } from 'lucide-react';
import { ModuleFormCard, DEFAULT_MODULE, type ModuleForm } from '@/components/course/module-form-card';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function AdminEditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.uid as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        certification: '',
        minScore: 85,
        minAttendance: 0,
        endDate: '',
        isActive: true,
        inviteCode: '',
    });
    const [modules, setModules] = useState<ModuleForm[]>([
        { ...DEFAULT_MODULE, order: 1 },
    ]);

    const addModule = () => {
        setModules(prev => [...prev, { ...DEFAULT_MODULE, order: prev.length + 1 }]);
    };

    const handleModuleChange = (idx: number, updated: ModuleForm) => {
        setModules(prev => prev.map((m, i) => i === idx ? updated : m));
    };

    const removeModule = (idx: number) => {
        setModules(prev => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 })));
    };

    const getIdToken = async () => {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error('No autenticado');
        return token;
    };

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const idToken = await getIdToken();
                const res = await fetch(`/api/admin/courses?id=${id}`, {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Curso no encontrado');

                const c = data.course;
                setFormData({
                    title: c.title || '',
                    description: c.description || '',
                    certification: c.certification || '',
                    minScore: c.minScore ?? 85,
                    minAttendance: c.minAttendance ?? 0,
                    endDate: typeof c.endDate === 'string' ? c.endDate.slice(0, 10) : '',
                    isActive: c.isActive ?? true,
                    inviteCode: c.inviteCode || '',
                });

                if (Array.isArray(c.modules) && c.modules.length > 0) {
                    setModules(c.modules.map((m: any, i: number) => ({
                        ...DEFAULT_MODULE,
                        ...m,
                        order: i + 1,
                        topics: Array.isArray(m.topics) && m.topics.length > 0 ? m.topics : [''],
                        scenarios: Array.isArray(m.scenarios) ? m.scenarios : [],
                        deadlineDate: m.deadlineDate || '',
                    })));
                }
            } catch (e: any) {
                setError(e.message || 'No se pudo cargar el curso.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            setSaving(true);
            setError(null);
            const idToken = await getIdToken();
            const validModules = modules
                .filter(m => m.title.trim())
                .map(m => ({ ...m, topics: m.topics.filter(Boolean) }));

            const res = await fetch('/api/admin/courses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                    id,
                    ...formData,
                    modules: validModules,
                    moduleCount: validModules.length,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al actualizar');
            toast.success('Curso actualizado');
            router.push(`/admin/courses/${id}`);
        } catch (e: any) {
            setError(e.message || 'No se pudo actualizar el curso.');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        padding: '10px 14px', borderRadius: 10,
        border: '1px solid var(--border)', fontSize: 14, outline: 'none',
        background: 'var(--muted)', width: '100%', color: 'var(--foreground)',
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Header title="Cargando curso" />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Editar curso" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ maxWidth: 820, margin: '0 auto' }}>
                    <button
                        onClick={() => router.push(`/admin/courses/${id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 16, fontSize: 14, fontWeight: 600 }}
                    >
                        <ArrowLeft size={16} /> Volver al curso
                    </button>

                    <PageHeader title="Editar curso" subtitle="Actualiza los detalles, módulos y configuración del programa" />

                    {error && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '12px 16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <AlertCircle size={20} />
                            <span style={{ fontSize: 14 }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>

                        {/* ── Información básica ──────────────────────────── */}
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, display: 'grid', gap: 24 }}>
                            <Field label="Nombre del curso" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required inputStyle={inputStyle} />
                            <Field label="Descripción" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} textarea inputStyle={inputStyle} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <Field label="Certificación" value={formData.certification} onChange={(v) => setFormData({ ...formData, certification: v })} required inputStyle={inputStyle} />
                                <Field label="Código de invitación" value={formData.inviteCode} onChange={(v) => setFormData({ ...formData, inviteCode: v.toUpperCase() })} required mono inputStyle={inputStyle} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <Field label="Puntaje mínimo (%)" type="number" value={String(formData.minScore ?? 85)} onChange={(v) => setFormData({ ...formData, minScore: Number(v) })} required inputStyle={inputStyle} />
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Total de módulos</label>
                                    <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--brand)', height: 42 }}>
                                        {modules.length} módulo{modules.length !== 1 ? 's' : ''} · auto-calculado
                                    </div>
                                </div>
                            </div>

                            {/* Gating de certificación + fecha final (Fase 2/3) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <Field label="Asistencia mínima (%)" type="number" value={String(formData.minAttendance ?? 0)} onChange={(v) => setFormData({ ...formData, minAttendance: Math.max(0, Math.min(100, Number(v) || 0)) })} inputStyle={inputStyle} />
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0 = no exigida. Se evalúa junto al puntaje para emitir el certificado.</span>
                                </div>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <Field label="Fecha final del curso" type="date" value={formData.endDate || ''} onChange={(v) => setFormData({ ...formData, endDate: v })} inputStyle={inputStyle} />
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Al llegar esta fecha, el sistema emite certificados automáticamente a los aprobados.</span>
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(formData.isActive)}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    style={{ width: 18, height: 18 }}
                                />
                                Curso activo y visible
                            </label>
                        </div>

                        {/* ── Módulos ──────────────────────────────────────── */}
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                                    <Layers size={18} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                    Plan de Estudios ({modules.length} módulo{modules.length !== 1 ? 's' : ''})
                                </h3>
                            </div>

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
                                width: '100%', padding: '13px', borderRadius: 12, border: '2px dashed var(--border)',
                                background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                                <Plus size={16} /> Agregar Módulo
                            </button>
                        </div>

                        {/* ── Acciones ─────────────────────────────────────── */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button type="button" onClick={() => router.push(`/admin/courses/${id}`)} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: 'var(--text-on-brand)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', required = false, textarea = false, mono = false, inputStyle }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; required?: boolean; textarea?: boolean; mono?: boolean;
    inputStyle: React.CSSProperties;
}) {
    const style = {
        ...inputStyle,
        fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: mono ? 700 : 400,
        color: mono ? 'var(--brand)' : 'var(--foreground)',
    };
    return (
        <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{label}</label>
            {textarea ? (
                <textarea rows={3} required={required} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...style, resize: 'vertical' }} />
            ) : (
                <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} style={style} />
            )}
        </div>
    );
}
