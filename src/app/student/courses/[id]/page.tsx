'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

        StudentEnrollmentService.getCourseDetails(courseId, user.uid)
            .then((data) => {
                if (data) {
                    setCourse(data.course);
                    setModules(data.modules);
                    setCompletedModules(data.progress);
                    setIsCourseLocked(data.isLocked || false);
                    setLockedReason(data.lockedReason || null);
                } else {
                    setCourse(null);
                }
            })
            .finally(() => setLoading(false));
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
                return `/student/courses/${courseId}/module/${module.id}?type=practica`;
            case 'certificacion':
                return `/student/courses/${courseId}/certificacion`;
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
                    <div style={{ width: 40, height: 40, border: '3px solid #E2E4F0', borderTopColor: '#1800AD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
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
                    <p style={{ color: '#64748B' }}>El curso no existe o no tienes acceso.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC' }}>
            <Header title={course.title} />

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {/* Course Header */}
                <div style={{
                    background: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24,
                    border: '1px solid #E2E4F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>{course.title}</h2>
                            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Instructor: {course.instructorName}</p>
                        </div>
                        <div style={{
                            background: '#EEF0FF', padding: '8px 16px', borderRadius: 12,
                            color: '#1800AD', fontWeight: 700, fontSize: 13
                        }}>
                            {course.certification}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ background: '#F1F5F9', borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Tu progreso</span>
                            <span style={{ fontSize: 12, color: '#64748B' }}>{completedCount} / {totalCount} módulos</span>
                        </div>
                        <div style={{ height: 8, background: '#E2E4F0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', width: `${progressPercent}%`, background: '#1800AD',
                                borderRadius: 4, transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <p style={{ fontSize: 11, color: '#1800AD', fontWeight: 600, marginTop: 6, margin: 0 }}>
                            {progressPercent}% completado
                        </p>
                    </div>
                </div>

                {/* Modules Section */}
                <div>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', marginBottom: 16 }}>
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
                            background: '#FFFFFF', borderRadius: 16, padding: 40, textAlign: 'center',
                            border: '1px solid #E2E4F0'
                        }}>
                            <p style={{ color: '#64748B' }}>No hay módulos disponibles aún.</p>
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
                                            background: '#FFFFFF', borderRadius: 16, padding: 16,
                                            border: isLocked ? '1px solid #E2E4F0' : '1px solid #E2E4F0',
                                            opacity: isLocked ? 0.6 : 1,
                                            textDecoration: 'none',
                                            transition: 'all 0.2s ease',
                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: isCompleted ? '#22C55E' : isLocked ? '#F1F5F9' : '#EEF0FF',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isCompleted ? '#FFFFFF' : isLocked ? '#94A3B8' : '#1800AD',
                                        }}>
                                            {isCompleted ? <CheckCircle size={22} /> : isLocked ? <Lock size={20} /> : typeInfo.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 700, color: isLocked ? '#94A3B8' : '#1800AD',
                                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                                }}>
                                                    {typeInfo.label}
                                                </span>
                                                {module.isRequired && (
                                                    <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600 }}>REQUERIDO</span>
                                                )}
                                            </div>
                                            <h4 style={{
                                                fontSize: 15, fontWeight: 700, color: isLocked ? '#94A3B8' : '#0F172A',
                                                margin: '4px 0 0'
                                            }}>
                                                {module.title}
                                            </h4>
                                            {module.estimatedMinutes && (
                                                <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
                                                    {module.estimatedMinutes} min
                                                </p>
                                            )}
                                        </div>
                                        {!isLocked && <ChevronRight size={20} style={{ color: '#CBD5E1' }} />}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Start Practice Button */}
                {modules.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                        <Link href={`/student/courses/${courseId}/start`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            background: '#1800AD', color: '#FFFFFF', padding: '16px 24px',
                            borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none',
                            boxShadow: '0 4px 12px rgba(24, 0, 173, 0.3)'
                        }}>
                            <PlayCircle size={22} />
                            Iniciar Práctica Guiada
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}