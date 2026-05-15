'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { GuideService } from '@/services/firestore.service';
import { CATEGORY_LABELS, type GuideModel, type GuideCategory, type GuideContentType } from '@/models/guide';
import { 
    Save, X, BookOpen, FileText, Clock, ShieldCheck, 
    Video, HelpCircle, Link as LinkIcon, ChevronRight,
    Type, Layout, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateGuidePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { id: courseId } = useParams() as { id: string };
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState<Omit<GuideModel, 'id' | 'uploadedAt'>>({
        title: '',
        description: '',
        courseId: courseId,
        contentType: 'pdf',
        contentUrl: '',
        uploadedBy: user?.uid || '',
        uploaderName: user ? `${user.firstName} ${user.lastName}` : '',
        category: 'teoria',
        required: true,
        order: 1,
        estimatedMinutes: 15,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleContentTypeChange = (type: GuideContentType) => {
        setFormData(prev => ({ ...prev, contentType: type }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        try {
            setLoading(true);
            await GuideService.create({
                ...formData,
                uploadedBy: user.uid,
                uploaderName: `${user.firstName} ${user.lastName}`
            } as any);
            toast.success('Módulo creado exitosamente');
            router.push(`/instructor/courses/${courseId}`);
        } catch (error) {
            console.error('Error creating guide:', error);
            toast.error('Error al crear el módulo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Configuración de Módulo" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.1em', marginBottom: 6 }}>CONTENIDO ACADÉMICO</div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>Crear Nuevo Módulo</h1>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
                        
                        <div style={{ display: 'grid', gap: 24 }}>
                            {/* Información Base */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'grid', gap: 24 }}>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Título del Módulo</label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej. Introducción a la Reanimación Avanzada"
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', outline: 'none', fontSize: 15 }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Descripción de Objetivos</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            placeholder="¿Qué aprenderá el estudiante en este módulo?"
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', outline: 'none', fontSize: 15, resize: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tipo de Contenido Selector */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 20, display: 'block' }}>Tipo de Contenido</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                    <ContentTypeItem 
                                        active={formData.contentType === 'pdf'} 
                                        icon={FileText} label="Documento PDF" 
                                        onClick={() => handleContentTypeChange('pdf')} 
                                    />
                                    <ContentTypeItem 
                                        active={formData.contentType === 'video'} 
                                        icon={Video} label="Video / Tutorial" 
                                        onClick={() => handleContentTypeChange('video')} 
                                    />
                                    <ContentTypeItem 
                                        active={formData.contentType === 'quiz'} 
                                        icon={HelpCircle} label="Evaluación / Quiz" 
                                        onClick={() => handleContentTypeChange('quiz')} 
                                    />
                                    <ContentTypeItem 
                                        active={formData.contentType === 'external'} 
                                        icon={LinkIcon} label="Link Externo" 
                                        onClick={() => handleContentTypeChange('external')} 
                                    />
                                </div>

                                <div style={{ marginTop: 24 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                        {formData.contentType === 'pdf' ? 'URL del Documento PDF' : 
                                         formData.contentType === 'video' ? 'URL de Video (YouTube/Vimeo)' : 
                                         formData.contentType === 'quiz' ? 'URL del Cuestionario' : 'URL Externa'}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Layout size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            name="contentUrl"
                                            value={formData.contentUrl}
                                            onChange={handleChange}
                                            required
                                            placeholder="https://..."
                                            style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', outline: 'none', fontSize: 14 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 24 }}>
                            {/* Ajustes Laterales */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'grid', gap: 20 }}>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Categoría</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14, background: 'var(--muted)' }}
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Esfuerzo Estimado (min)</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="number"
                                            name="estimatedMinutes"
                                            value={formData.estimatedMinutes}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14 }}
                                        />
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setFormData(p => ({ ...p, required: !p.required }))}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, 
                                        background: formData.required ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', border: '1px solid',
                                        borderColor: formData.required ? 'var(--brand)' : 'var(--border)'
                                    }}
                                >
                                    <ShieldCheck size={18} style={{ color: formData.required ? 'var(--brand)' : 'var(--text-muted)' }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: formData.required ? 'var(--brand)' : 'var(--text-secondary)' }}>Módulo Obligatorio</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 16,
                                    background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                                    opacity: loading ? 0.7 : 1, boxShadow: '0 4px 6px -1px rgba(24, 0, 173, 0.3)'
                                }}
                            >
                                <Send size={18} /> {loading ? 'PUBLICANDO...' : 'PUBLICAR MÓDULO'}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.back()}
                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancelar y volver
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function ContentTypeItem({ active, icon: Icon, label, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            style={{ 
                padding: '16px 8px', borderRadius: 16, border: '2px solid', 
                borderColor: active ? 'var(--brand)' : 'var(--border)', 
                background: active ? 'var(--accent)' : 'var(--text-on-brand)',
                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
            }}
        >
            <Icon size={24} style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: active ? 'var(--brand)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
        </div>
    );
}
