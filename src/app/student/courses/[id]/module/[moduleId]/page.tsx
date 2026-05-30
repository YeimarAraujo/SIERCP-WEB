'use client';

import { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/shared/hooks/use-auth';
import { BookOpen, PlayCircle, CheckCircle, ChevronLeft, FileText, Video } from 'lucide-react';
import Link from 'next/link';

interface Module {
    id: string;
    title: string;
    description?: string;
    type: string;
    contentUrl?: string;
    videoUrl?: string;
    estimatedMinutes?: number;
    order: number;
}

export default function StudentModuleViewerPage({ params }: { params: Promise<{ id: string; moduleId: string }> }) {
    const { id: courseId, moduleId } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [module, setModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [activeTab, setActiveTab] = useState<'pdf' | 'video'>('pdf');
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        if (!user || !courseId || !moduleId) return;
        let cancelled = false;

        const load = async () => {
            try {
                const token = await getAuth().currentUser?.getIdToken();
                if (!token) return;
                const res = await fetch(`/api/student/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const found = (data.modules || []).find((m: Module) => m.id === moduleId);
                setModule(found || null);
                setCompleted(Array.isArray(data.progress) && data.progress.includes(moduleId));
            } catch (e) {
                console.error('Error cargando módulo:', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [user, courseId, moduleId]);

    const handleMarkComplete = async () => {
        if (!user || !courseId || !moduleId || marking) return;
        setMarking(true);
        try {
            const token = await getAuth().currentUser?.getIdToken();
            const res = await fetch(`/api/student/courses/${courseId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ moduleId }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'No se pudo marcar como completado');
            }
            setCompleted(true);
        } catch (e) {
            console.error('Error marking complete:', e);
        }
        setMarking(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Header title="Cargando módulo..." />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!module) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Header title="Módulo no encontrado" />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>El módulo no existe.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--muted)' }}>
            <Header 
                title={module.title}
                showBack
                onBack={() => router.push(`/student/courses/${courseId}`)}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Module Info */}
                <div style={{
                    background: 'var(--card)', borderBottom: '1px solid var(--border)',
                    padding: '16px 24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--brand)'
                            }}>
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>
                                    Teoría
                                </span>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                    {module.title}
                                </h3>
                            </div>
                        </div>
                        {completed && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: '#DCFCE7', padding: '6px 12px', borderRadius: 20
                            }}>
                                <CheckCircle size={16} color="#16A34A" />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>Completado</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {module.contentUrl && module.videoUrl && (
                    <div style={{ display: 'flex', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setActiveTab('pdf')}
                            style={{
                                flex: 1, padding: '14px', border: 'none', background: 'transparent',
                                borderBottom: activeTab === 'pdf' ? '2px solid var(--brand)' : '2px solid transparent',
                                color: activeTab === 'pdf' ? 'var(--brand)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'pdf' ? 700 : 500, fontSize: 14, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}
                        >
                            <FileText size={18} />
                            Material PDF
                        </button>
                        <button
                            onClick={() => setActiveTab('video')}
                            style={{
                                flex: 1, padding: '14px', border: 'none', background: 'transparent',
                                borderBottom: activeTab === 'video' ? '2px solid var(--brand)' : '2px solid transparent',
                                color: activeTab === 'video' ? 'var(--brand)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'video' ? 700 : 500, fontSize: 14, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}
                        >
                            <Video size={18} />
                            Video
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div style={{ padding: 24 }}>
                    {activeTab === 'pdf' && module.contentUrl && (
                        <div style={{
                            background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
                            overflow: 'hidden', height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <iframe
                                src={module.contentUrl}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="PDF Viewer"
                            />
                        </div>
                    )}

                    {activeTab === 'video' && module.videoUrl && (
                        <div style={{
                            background: '#000', borderRadius: 16, overflow: 'hidden',
                            aspectRatio: '16/9', maxHeight: 400
                        }}>
                            <iframe
                                src={module.videoUrl.replace('watch?v=', 'embed/')}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="Video Player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {!module.contentUrl && !module.videoUrl && (
                        <div style={{
                            background: 'var(--card)', borderRadius: 16, padding: 40, textAlign: 'center',
                            border: '1px solid var(--border)'
                        }}>
                            <p style={{ color: 'var(--text-secondary)' }}>No hay contenido disponible para este módulo.</p>
                        </div>
                    )}
                </div>

                {/* Mark Complete Button */}
                {!completed && (
                    <div style={{ padding: '0 24px 24px' }}>
                        <button
                            onClick={handleMarkComplete}
                            disabled={marking}
                            style={{
                                width: '100%', padding: '16px 24px', borderRadius: 14,
                                background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none',
                                fontSize: 15, fontWeight: 700, cursor: marking ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                opacity: marking ? 0.7 : 1
                            }}
                        >
                            {marking ? (
                                <>
                                    <div style={{ width: 20, height: 20, border: '2px solid var(--card)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Marcar como Completado
                                </>
                            )}
                        </button>
                        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}
            </div>
        </div>
    );
}