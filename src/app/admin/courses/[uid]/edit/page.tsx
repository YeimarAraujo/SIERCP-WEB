'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useParams, useRouter } from 'next/navigation';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';

export default function AdminEditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.uid as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CourseModel>>({
        title: '',
        description: '',
        certification: '',
        minScore: 85,
        isActive: true,
        moduleCount: 1,
        inviteCode: '',
    });

    useEffect(() => {
        if (!id) return;
        CourseService.get(id).then((data) => {
            if (data) {
                setFormData({
                    title: data.title,
                    description: data.description || '',
                    certification: data.certification,
                    minScore: data.minScore ?? data.requiredScore ?? 85,
                    isActive: data.isActive,
                    moduleCount: data.moduleCount ?? data.totalModules ?? 1,
                    inviteCode: data.inviteCode,
                });
            }
            setLoading(false);
        }).catch(() => {
            setError('No se pudo cargar el curso.');
            setLoading(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            setSaving(true);
            setError(null);
            await CourseService.update(id, formData);
            router.push(`/admin/courses/${id}`);
        } catch {
            setError('No se pudo actualizar el curso. Intenta nuevamente.');
        } finally {
            setSaving(false);
        }
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

                    <PageHeader title="Editar curso" subtitle="Actualiza nombre, certificacion, codigo y requisitos del programa" />

                    {error && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '12px 16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <AlertCircle size={20} />
                            <span style={{ fontSize: 14 }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, display: 'grid', gap: 24 }}>
                        <Field label="Nombre del curso" value={formData.title || ''} onChange={(value) => setFormData({ ...formData, title: value })} required />
                        <Field label="Descripcion" value={formData.description || ''} onChange={(value) => setFormData({ ...formData, description: value })} textarea />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <Field label="Certificacion" value={formData.certification || ''} onChange={(value) => setFormData({ ...formData, certification: value })} required />
                            <Field label="Codigo de invitacion" value={formData.inviteCode || ''} onChange={(value) => setFormData({ ...formData, inviteCode: value.toUpperCase() })} required mono />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <Field label="Puntaje minimo (%)" type="number" value={String(formData.minScore ?? 85)} onChange={(value) => setFormData({ ...formData, minScore: Number(value) })} required />
                            <Field label="Total de modulos" type="number" value={String(formData.moduleCount ?? 1)} onChange={(value) => setFormData({ ...formData, moduleCount: Number(value) })} required />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                            <input
                                type="checkbox"
                                checked={Boolean(formData.isActive)}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                style={{ width: 18, height: 18 }}
                            />
                            Curso activo y visible
                        </label>

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

function Field({ label, value, onChange, type = 'text', required = false, textarea = false, mono = false }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    textarea?: boolean;
    mono?: boolean;
}) {
    const commonStyle = {
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        fontSize: 14,
        outline: 'none',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: mono ? 700 : 400,
        color: mono ? 'var(--brand)' : 'var(--foreground)',
    } as const;

    return (
        <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{label}</label>
            {textarea ? (
                <textarea rows={3} required={required} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...commonStyle, resize: 'vertical' }} />
            ) : (
                <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} style={commonStyle} />
            )}
        </div>
    );
}
