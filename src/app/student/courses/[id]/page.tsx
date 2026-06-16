'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/shared/hooks/use-auth';
import { StudentEnrollmentService } from '@/shared/lib/student-enrollment.service';
import type { CourseModel } from '@/shared/types/course';
import { BookOpen, PlayCircle, ClipboardCheck, Award, Lock, CheckCircle, Circle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Module {
    id: string;
    title: string;
    description?: string;
    type: 'teoria' | 'evaluacion_teorica' | 'practica_guiada' | 'certificacion' | string;
    order: number;
    estimatedMinutes?: number;
    isRequired: boolean;
}

const moduleTypeLabels: Record<string, { icon: React.ReactNode; label: string }> = {
    teoria: { icon: <BookOpen size={18} />, label: 'Teoría' },
    evaluacion_teorica: { icon: <ClipboardCheck size={18} />, label: 'Evaluación' },
    practica_guiada: { icon: <PlayCircle size={18} />, label: 'Práctica' },
    certificacion: { icon: <Award size={18} />, label: 'Certificación' },
};

export default function StudentCourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const courseId = params.id as string;

    const [course, setCourse] = useState<CourseModel | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isCourseLocked, setIsCourseLocked] = useState(false);
    const [lockedReason, setLockedReason] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !courseId) return;
        let cancelled = false;

        const load = async () => {
            try {
                const token = await getAuth().currentUser?.getIdToken();
                if (token) {
                    const res = await fetch(`/api/student/courses/${courseId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (cancelled) return;
                        setCourse(data.course);
                        setModules(data.modules || []);
                        setCompletedModules(new Set<string>(data.progress || []));
                        setIsCourseLocked(false);
                        setLockedReason(null);
                        return;
                    }
                    // 404 → no es un curso de institución por docId; sigue al fallback.
                    if (res.status !== 404) {
                        const err = await res.json().catch(() => ({}));
                        console.error('Error API student course:', err.error);
                    }
                }

                // 2) Fallback: cursos de plataforma (por slug) y catálogo legacy.
                const data = await StudentEnrollmentService.getCourseDetails(courseId, user.uid);
                if (cancelled) return;
                if (data) {
                    setCourse(data.course);
                    setModules(data.modules);
                    setCompletedModules(data.progress);
                    setIsCourseLocked(data.isLocked || false);
                    setLockedReason(data.lockedReason || null);
                } else {
                    setCourse(null);
                }
            } catch (e) {
                if (!cancelled) console.error('Error cargando curso:', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [user, courseId]);

    const completedCount = completedModules.size;
    const totalCount = modules.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const getModuleHref = (module: Module, index: number) => {
        const prevCompleted = index === 0 || completedModules.has(modules[index - 1].id);
        if (!prevCompleted && !completedModules.has(module.id)) return '#';

        switch (module.type) {
            case 'teoria':
                return `/student/courses/${courseId}/module/${module.id}?type=teoria`;
            case 'evaluacion_teorica':
                return `/student/courses/${courseId}/module/${module.id}?type=quiz`;
            case 'practica_guiada':
                return `/student/courses/${courseId}/module/${module.id}?type=practica_guiada`;
            case 'certificacion':
                // No existe una página /certificacion dedicada; los certificados se
                // emiten automáticamente y se consultan en la sección de certificados.
                return `/student/certificates`;
            default:
                return '#';
        }
    };

    const isModuleLocked = (index: number, moduleId: string): boolean => {
        const isCompleted = completedModules.has(moduleId);
        const previousCompleted = index === 0 || completedModules.has(modules[index - 1].id);
        return !previousCompleted && !isCompleted;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Header title="Cargando..." />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Header title="Curso no encontrado" />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>El curso no existe o no tienes acceso.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--muted)' }}>
            <Header title={course.title} />

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {/* Course Header */}
                <div style={{
                    background: 'var(--card)', borderRadius: 20, padding: 20, marginBottom: 24,
                    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{course.title}</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Instructor: {course.instructorName}</p>
                        </div>
                        <div style={{
                            background: 'var(--accent)', padding: '8px 16px', borderRadius: 12,
                            color: 'var(--brand)', fontWeight: 700, fontSize: 13
                        }}>
                            {course.certification}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Tu progreso</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{completedCount} / {totalCount} módulos</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', width: `${progressPercent}%`, background: 'var(--brand)',
                                borderRadius: 4, transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, marginTop: 6, margin: 0 }}>
                            {progressPercent}% completado
                        </p>
                    </div>
                </div>

                {/* Modules Section */}
                <div>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 16 }}>
                        MÓDULOS A COMPLETAR
                    </h3>

                    {isCourseLocked ? (
                        <div style={{
                            background: '#FFFBEB', borderRadius: 16, padding: 40, textAlign: 'center',
                            border: '1px solid #FEF3C7'
                        }}>
                            <Lock size={32} color="#D97706" style={{ marginBottom: 16 }} />
                            <h4 style={{ color: '#92400E', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Curso No Iniciado</h4>
                            <p style={{ color: '#B45309', margin: 0 }}>
                                {lockedReason || 'El contenido estará disponible cuando inicie la formación.'}
                            </p>
                        </div>
                    ) : modules.length === 0 ? (
                        <div style={{
                            background: 'var(--card)', borderRadius: 16, padding: 40, textAlign: 'center',
                            border: '1px solid var(--border)'
                        }}>
                            <p style={{ color: 'var(--text-secondary)' }}>No hay módulos disponibles aún.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {modules.map((module, index) => {
                                const isCompleted = completedModules.has(module.id);
                                const isLocked = isModuleLocked(index, module.id);
                                const typeInfo = moduleTypeLabels[module.type] || { icon: <BookOpen size={18} />, label: 'Módulo' };
                                const href = getModuleHref(module, index);

                                return (
                                    <Link
                                        key={module.id}
                                        href={href === '#' ? '#' : href}
                                        onClick={(e) => {
                                            if (href === '#') e.preventDefault();
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 16,
                                            background: 'var(--card)', borderRadius: 16, padding: 16,
                                            border: isLocked ? '1px solid var(--border)' : '1px solid var(--border)',
                                            opacity: isLocked ? 0.6 : 1,
                                            textDecoration: 'none',
                                            transition: 'all 0.2s ease',
                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: isCompleted ? '#22C55E' : isLocked ? 'var(--muted)' : 'var(--accent)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isCompleted ? 'var(--text-on-brand)' : isLocked ? 'var(--text-muted)' : 'var(--brand)',
                                        }}>
                                            {isCompleted ? <CheckCircle size={22} /> : isLocked ? <Lock size={20} /> : typeInfo.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 700, color: isLocked ? 'var(--text-muted)' : 'var(--brand)',
                                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                                }}>
                                                    {typeInfo.label}
                                                </span>
                                                {module.isRequired && (
                                                    <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600 }}>REQUERIDO</span>
                                                )}
                                            </div>
                                            <h4 style={{
                                                fontSize: 15, fontWeight: 700, color: isLocked ? 'var(--text-muted)' : 'var(--foreground)',
                                                margin: '4px 0 0'
                                            }}>
                                                {module.title}
                                            </h4>
                                            {module.estimatedMinutes && (
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                                                    {module.estimatedMinutes} min
                                                </p>
                                            )}
                                        </div>
                                        {!isLocked && <ChevronRight size={20} style={{ color: 'var(--border-strong)' }} />}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Acceso a la práctica guiada: abre el primer módulo de práctica
                    (su vista explica que se realiza en la app SIERCP con el maniquí).
                    Antes apuntaba a /start, que no existe → 404. */}
                {(() => {
                    const practica = modules.find((m) => m.type === 'practica_guiada');
                    if (!practica) return null;
                    return (
                        <div style={{ marginTop: 24 }}>
                            <Link href={`/student/courses/${courseId}/module/${practica.id}?type=practica_guiada`} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                background: 'var(--brand)', color: 'var(--text-on-brand)', padding: '16px 24px',
                                borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none',
                                boxShadow: '0 4px 12px rgba(24, 0, 173, 0.3)'
                            }}>
                                <PlayCircle size={22} />
                                Ver práctica guiada
                            </Link>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}