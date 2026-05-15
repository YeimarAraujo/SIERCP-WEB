'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { GuideService } from '@/services/firestore.service';
import { CATEGORY_LABELS, type GuideModel } from '@/models/guide';
import { Save, X, FileText, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditGuidePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { id: courseId, guideId } = useParams() as { id: string, guideId: string };
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (!guideId) return;
        // Ideally we need a getGuideById, but we can filter from all guides for now or add it to service
        // Let's assume we have GuideService.get(guideId)
        GuideService.getByCourse(courseId).then(guides => {
            const guide = guides.find(g => g.id === guideId);
            if (guide) setFormData(guide);
            setLoading(false);
        });
    }, [guideId, courseId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setFormData((prev: any) => prev ? ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }) : null);
    };

    const handleToggle = () => {
        setFormData((prev: any) => prev ? ({ ...prev, required: !prev.required }) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData) return;
        
        try {
            setSaving(true);
            await GuideService.update(formData.id, formData);
            toast.success('Módulo actualizado exitosamente');
            router.push(`/instructor/courses/${courseId}`);
        } catch (error) {
            console.error('Error updating guide:', error);
            toast.error('Error al actualizar el módulo');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: 64, textAlign: 'center' }}><Loader2 className="animate-spin" /></div>;
    if (!formData) return <div style={{ padding: 64, textAlign: 'center' }}>Módulo no encontrado</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Editar Módulo" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <PageHeader 
                        title={`Editando: ${formData.title}`} 
                        subtitle="Modifica los parámetros del contenido teórico" 
                    />

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24, marginTop: 24 }}>
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'grid', gap: 20 }}>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Título del módulo</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14 }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Categoría</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14 }}
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Tiempo estimado (min)</label>
                                    <input
                                        type="number"
                                        name="estimatedMinutes"
                                        value={formData.estimatedMinutes}
                                        onChange={handleChange}
                                        required
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14 }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>URL del PDF</label>
                                <div style={{ position: 'relative' }}>
                                    <FileText size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        name="contentUrl"
                                        value={formData?.contentUrl}
                                        onChange={handleChange}
                                        required
                                        style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14 }}
                                    />
                                </div>
                            </div>

                            <div 
                                onClick={handleToggle}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, 
                                    background: formData.required ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', border: '1px solid',
                                    borderColor: formData.required ? 'var(--brand)' : 'var(--border)', transition: 'all 0.2s'
                                }}
                            >
                                <ShieldCheck size={20} style={{ color: formData.required ? 'var(--brand)' : 'var(--text-muted)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: formData.required ? 'var(--brand)' : 'var(--text-secondary)' }}>Módulo Obligatorio</div>
                                    <div style={{ fontSize: 12, color: formData.required ? 'var(--brand)' : 'var(--text-secondary)', opacity: 0.8 }}>Los estudiantes deben completar este módulo para aprobar.</div>
                                </div>
                                <div style={{ 
                                    width: 40, height: 20, borderRadius: 20, background: formData.required ? 'var(--brand)' : 'var(--border-strong)',
                                    position: 'relative', transition: 'all 0.2s'
                                }}>
                                    <div style={{ 
                                        width: 14, height: 14, borderRadius: '50%', background: 'var(--card)',
                                        position: 'absolute', top: 3, left: formData.required ? 23 : 3, transition: 'all 0.2s'
                                    }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                                    background: 'var(--muted)', color: 'var(--text-secondary)', border: 'none', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                <X size={18} /> Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10,
                                    background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, cursor: 'pointer',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                <Save size={18} /> {saving ? 'Actualizando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
