'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/shared/hooks/use-auth';
import { BookOpen, CheckCircle, FileText, Video, HeartPulse, ClipboardList, Award, Smartphone } from 'lucide-react';
import {
    normalizeScenario,
    CLINICAL_SCENARIO_LABELS,
    CLINICAL_SCENARIO_DIFFICULTY,
    CLINICAL_SCENARIO_PATIENT_TYPE,
} from '@/shared/constants/clinical_scenarios';

// Metadatos por tipo de módulo (antes el encabezado decía siempre "Teoría").
const MODULE_META: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
    teoria: { label: 'Teoría', icon: BookOpen, color: 'var(--brand)' },
    evaluacion_teorica: { label: 'Evaluación teórica', icon: ClipboardList, color: '#7C3AED' },
    practica_guiada: { label: 'Práctica guiada', icon: HeartPulse, color: '#DC2626' },
    certificacion: { label: 'Certificación', icon: Award, color: '#D97706' },
};

const PATIENT_LABEL: Record<string, string> = { adult: 'Adulto', pediatric: 'Pediátrico', infant: 'Lactante' };

function scenarioInfo(raw: string): { title: string; difficulty: string; patient: string } {
    try {
        const s = normalizeScenario(raw);
        return {
            title: CLINICAL_SCENARIO_LABELS[s] ?? raw,
            difficulty: CLINICAL_SCENARIO_DIFFICULTY[s] ?? '',
            patient: PATIENT_LABEL[CLINICAL_SCENARIO_PATIENT_TYPE[s]] ?? '',
        };
    } catch {
        return { title: raw, difficulty: '', patient: '' };
    }
}

interface Module {
    id: string;
    title: string;
    description?: string;
    type: string;
    contentUrl?: string;
    videoUrl?: string;
    scenarios?: string[];
    topics?: string[];
    estimatedMinutes?: number;
    passingScore?: number;
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
                            {(() => {
                                const meta = MODULE_META[module.type] ?? MODULE_META.teoria;
                                const Icon = meta.icon;
                                return (
                                    <>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: meta.color
                                        }}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase' }}>
                                                {meta.label}
                                            </span>
                                            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                                                {module.title}
                                            </h3>
                                        </div>
                                    </>
                                );
                            })()}
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
                    {module.contentUrl && (activeTab === 'pdf' || !module.videoUrl) && (
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

                    {module.videoUrl && (activeTab === 'video' || !module.contentUrl) && (
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

                    {module.type === 'practica_guiada' && (
                        <div style={{ display: 'grid', gap: 16, marginTop: (module.contentUrl || module.videoUrl) ? 16 : 0 }}>
                            {/* Aviso: la práctica con maniquí se realiza en la app SIERCP */}
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 16 }}>
                                <Smartphone size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontWeight: 800, color: '#991B1B', fontSize: 14 }}>Práctica con maniquí en la app SIERCP</div>
                                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7F1D1D' }}>
                                        Estos escenarios se realizan desde la app móvil SIERCP conectada al maniquí. Tu desempeño (calidad AHA) se registra automáticamente y cuenta para tu nota del curso.
                                    </p>
                                </div>
                            </div>

                            <div style={{ background: 'var(--card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>
                                    Escenarios de práctica ({module.scenarios?.length ?? 0})
                                </h3>
                                {module.scenarios?.length ? (
                                    <div style={{ display: 'grid', gap: 10 }}>
                                        {module.scenarios.map((scenario) => {
                                            const info = scenarioInfo(scenario);
                                            return (
                                                <div key={scenario} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--muted)', border: '1px solid var(--border)' }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
                                                        <HeartPulse size={18} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{info.title}</div>
                                                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                                            {info.difficulty && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'var(--accent)', color: 'var(--brand)' }}>{info.difficulty}</span>}
                                                            {info.patient && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{info.patient}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>No hay escenarios configurados para esta práctica.</p>
                                )}

                                {!!module.topics?.length && (
                                    <>
                                        <h3 style={{ margin: '20px 0 10px', fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>Temas</h3>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {module.topics.map((topic) => (
                                                <span key={topic} style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{topic}</span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Evaluación teórica / Certificación: el quiz/examen se hace en la app */}
                    {(module.type === 'evaluacion_teorica' || module.type === 'certificacion') && !module.contentUrl && !module.videoUrl && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                            {module.type === 'certificacion' ? <Award size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} /> : <ClipboardList size={20} color="#7C3AED" style={{ flexShrink: 0, marginTop: 2 }} />}
                            <div>
                                <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14 }}>
                                    {module.type === 'certificacion' ? 'Módulo de certificación' : 'Evaluación teórica'}
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                                    {module.type === 'certificacion'
                                        ? 'Al cumplir los requisitos del curso (nota y asistencia), tu certificado se emite automáticamente y podrás verlo en tu perfil.'
                                        : `Esta evaluación se responde en la app SIERCP. Puntaje mínimo para aprobar: ${module.passingScore ?? 70}%.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Sin contenido en módulos de teoría */}
                    {module.type !== 'practica_guiada' && module.type !== 'evaluacion_teorica' && module.type !== 'certificacion' && !module.contentUrl && !module.videoUrl && (
                        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 40, textAlign: 'center', border: '1px solid var(--border)' }}>
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