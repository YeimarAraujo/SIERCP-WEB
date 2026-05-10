'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useParams, useRouter } from 'next/navigation';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';

export default function EditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [course, setCourse] = useState<CourseModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        certification: '',
        requiredScore: 85,
        isActive: true,
        totalModules: 1,
        inviteCode: '',
    });

    useEffect(() => {
        if (!id) return;
        CourseService.get(id).then(data => {
            if (data) {
                setCourse(data);
                setFormData({
                    title: data.title,
                    description: data.description || '',
                    certification: data.certification,
                    requiredScore: data.minScore || data.requiredScore || 85,
                    isActive: data.isActive,
                    totalModules: data.moduleCount || data.totalModules || 1,
                    inviteCode: data.inviteCode,
                });
            }
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
            router.push(`/instructor/courses/${id}`);
        } catch (err) {
            console.error('Error updating course:', err);
            setError('No se pudo actualizar el curso. Por favor, intenta de nuevo.');
        } finally {
            setSaving(false);
        }
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
                        onClick={() => router.back()}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                            color: '#64748B', cursor: 'pointer', marginBottom: 16, fontSize: 14, fontWeight: 500
                        }}
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <PageHeader title="Editar curso" subtitle="Modifica los detalles y requisitos del curso" />

                    {error && (
                        <div style={{ 
                            background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, 
                            padding: '12px 16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24
                        }}>
                            <AlertCircle size={20} />
                            <span style={{ fontSize: 14 }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 16, padding: 32, display: 'grid', gap: 24 }}>
                        <div style={{ display: 'grid', gap: 8 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Nombre del curso</label>
                            <input 
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                style={{ 
                                    padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E4F0', fontSize: 14, outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Descripción</label>
                            <textarea 
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ 
                                    padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E4F0', fontSize: 14, outline: 'none', resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Certificación</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.certification}
                                    onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                                    style={{ 
                                        padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E4F0', fontSize: 14, outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Código de invitación</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.inviteCode}
                                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                                    style={{ 
                                        padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E4F0', fontSize: 14, outline: 'none',
                                        fontFamily: 'monospace', fontWeight: 600, color: '#1800AD'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Puntaje mínimo de aprobación (%)</label>
                                <input 
                                    type="number"
                                    min="1"
                                    max="100"
                                    required
                                    value={formData.requiredScore}
                                    onChange={(e) => setFormData({ ...formData, requiredScore: parseInt(e.target.value) })}
                                    style={{ 
                                        padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E4F0', fontSize: 14, outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Total de módulos</label>
                                <input 
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.totalModules}
                                    onChange={(e) => setFormData({ ...formData, totalModules: parseInt(e.target.value) })}
                                    style={{ 
                                        padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E4F0', fontSize: 14, outline: 'none'
                                    }}
                                />
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
                            <label htmlFor="isActive" style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}>
                                Curso activo y visible para estudiantes
                            </label>
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button 
                                type="button"
                                onClick={() => router.back()}
                                style={{ 
                                    padding: '12px 24px', borderRadius: 10, border: '1px solid #E2E4F0', 
                                    background: 'transparent', color: '#64748B', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={saving}
                                style={{ 
                                    padding: '12px 24px', borderRadius: 10, border: 'none', 
                                    background: '#1800AD', color: '#FFFFFF', fontWeight: 600, 
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
