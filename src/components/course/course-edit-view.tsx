'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { Save, ArrowLeft, AlertCircle, Plus, Layers } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { ModuleFormCard, DEFAULT_MODULE, type ModuleForm } from '@/components/course/module-form-card';

interface Props {
    /** ID del curso a editar */
    courseId: string;
    /** Base de ruta del shell actual; al guardar redirige a `${basePath}/${courseId}` */
    basePath: string;
}

export function CourseEditView({ courseId: id, basePath }: Props) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modules, setModules] = useState<ModuleForm[]>([
        { ...DEFAULT_MODULE, order: 1 },
    ]);

    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        certification: '',
        minScore: 85,
        isActive: true,
        moduleCount: 1,
        inviteCode: '',
    });

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
                const token = await getIdToken();
                const res = await fetch(`/api/instructor/courses/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error((await res.json()).error);
                const data = await res.json();
                const c = data.course;

                setFormData({
                    title: c.title || '',
                    description: c.description || '',
                    certification: c.certification || '',
                    minScore: c.minScore ?? 85,
                    isActive: c.isActive ?? true,
                    moduleCount: c.moduleCount ?? c.totalModules ?? 0,
                    inviteCode: c.inviteCode || '',
                });

                const existing = Array.isArray(c.modules) ? c.modules : [];
                if (existing.length > 0) {
                    setModules(existing.map((m: any, i: number) => {
                        // API devuelve módulos de la subcolección con campo config
                        const cfg = m.config || m;
                        const contentUrl = cfg.videoUrl || cfg.pdfUrl || cfg.textContent || m.contentUrl || '';
                        const contentType = cfg.videoUrl ? 'video' : cfg.pdfUrl ? 'pdf' : 'external';
                        return {
                            ...DEFAULT_MODULE,
                            id: m.id,
                            title: m.title || '',
                            topics: Array.isArray(cfg.topics) && cfg.topics.length > 0 ? cfg.topics : [''],
                            duration: cfg.duration || m.duration || '',
                            order: i + 1,
                            type: m.type || DEFAULT_MODULE.type,
                            contentType,
                            contentUrl,
                            passingScore: cfg.passingScore || DEFAULT_MODULE.passingScore,
                            deadlineDate: cfg.deadlineDate || '',
                            isRequired: cfg.isRequired ?? DEFAULT_MODULE.isRequired,
                            scenarios: Array.isArray(cfg.requiredSessions)
                                ? cfg.requiredSessions.map((s: any) => s.scenarioId)
                                : Array.isArray(m.scenarios) ? m.scenarios : [],
                        };
                    }));
                }
            } catch (err: any) {
                setError(err.message || 'Error al cargar el curso');
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
            const token = await getIdToken();
            const validModules = modules
                .filter(m => m.title.trim())
                .map(m => ({ ...m, topics: m.topics.filter(Boolean) }));

            const res = await fetch(`/api/instructor/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...formData, modules: validModules }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            router.push(`${basePath}/${id}`);
        } catch (err: any) {
            setError(err.message || 'No se pudo actualizar el curso.');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        padding: '10px 14px', borderRadius: 10,
        border: '1px solid var(--border)', fontSize: 14, outline: 'none',
        background: 'var(--muted)', width: '100%',
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Header title="Cargando..." />
                <div style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Editar curso" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <button
                        onClick={() => router.push(`${basePath}/${id}`)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                            color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 16, fontSize: 14, fontWeight: 500
                        }}
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <PageHeader title="Editar curso" subtitle="Modifica los detalles, módulos y requisitos del curso" />

                    {error && (
                        <div style={{
                            background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12,
                            padding: '12px 16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24
                        }}>
                            <AlertCircle size={20} />
                            <span style={{ fontSize: 14 }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>

                        {/* Información básica */}
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, display: 'grid', gap: 24 }}>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Nombre del curso</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Descripción</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Certificación</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.certification}
                                        onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Código de invitación</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.inviteCode}
                                        onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                                        style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand)' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Puntaje mínimo de aprobación (%)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        required
                                        value={formData.minScore}
                                        onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Total de módulos</label>
                                    <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--brand)' }}>
                                        {modules.length} módulo{modules.length !== 1 ? 's' : ''} · auto-calculado
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <label htmlFor="isActive" style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', cursor: 'pointer' }}>
                                    Curso activo y visible para estudiantes
                                </label>
                            </div>
                        </div>

                        {/* Módulos */}
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                                    <Layers size={18} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Plan de Estudios (Módulos)</h3>
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

                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button
                                type="button"
                                onClick={() => router.push(`${basePath}/${id}`)}
                                style={{
                                    padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)',
                                    background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '12px 24px', borderRadius: 10, border: 'none',
                                    background: 'var(--brand)', color: 'var(--text-on-brand)', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                <Save size={18} />
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
