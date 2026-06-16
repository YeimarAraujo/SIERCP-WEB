'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import { formatDate } from '@/lib/utils';
import type { CourseModel } from '@/models/course';
import { BookOpen, Users, Calendar, Plus, Radio } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { CourseQr } from '@/components/ui/course-qr';

export default function InstructorCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);
    // mapa courseId → cantidad de sesiones activas
    const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
    const unsubsRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchCourses = async () => {
            try {
                setLoading(true);
                const data = await CourseService.getByInstructor(user.uid, true);
                setCourses(data);

                // Cancelar suscripciones anteriores
                unsubsRef.current.forEach(u => u());
                unsubsRef.current = [];

                // Suscribir a sesiones activas por curso (RTDB-lite vía Firestore)
                data.forEach(course => {
                    const q = query(
                        collection(db, 'sessions'),
                        where('courseId', '==', course.id),
                        where('status', '==', 'active'),
                    );
                    const unsub = onSnapshot(q, snap => {
                        setLiveCounts(prev => ({ ...prev, [course.id]: snap.size }));
                    });
                    unsubsRef.current.push(unsub);
                });
            } catch (error) {
                console.error('Error fetching instructor courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();

        return () => {
            unsubsRef.current.forEach(u => u());
            unsubsRef.current = [];
        };
    }, [user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Mis Cursos" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Cursos"
                    subtitle="Gestión de programas académicos y control de matrículas"
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                    actions={
                        <Link href="/instructor/courses/create" style={{ textDecoration: 'none' }}>
                            <button style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12,
                                background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(24, 0, 173, 0.3)'
                            }}>
                                <Plus size={18} /> Crear Curso
                            </button>
                        </Link>
                    }
                />

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: 200, borderRadius: 24, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <EmptyState
                        title="No tienes cursos asignados aún"
                        description="Cuando un administrador te asigne cursos, aparecerán aquí para que puedas monitorear el progreso de tus alumnos."
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/instructor/courses/${course.id}`}
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    background: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 24,
                                    padding: 24,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--brand)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(24, 0, 173, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 14, background: 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)'
                                    }}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {/* Badge EN VIVO cuando hay sesiones activas */}
                                        {(liveCounts[course.id] ?? 0) > 0 && (
                                            <Link
                                                href="/instructor/monitor"
                                                onClick={e => e.stopPropagation()}
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <span style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    fontSize: 10, fontWeight: 900, padding: '5px 10px', borderRadius: 10,
                                                    background: '#ECFDF5', color: '#10B981',
                                                    border: '1px solid rgba(16,185,129,0.25)',
                                                    cursor: 'pointer',
                                                    animation: 'live-glow 2s ease-in-out infinite',
                                                }}>
                                                    <Radio size={10} />
                                                    {liveCounts[course.id]} EN VIVO
                                                </span>
                                            </Link>
                                        )}
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, padding: '6px 12px', borderRadius: 10,
                                            background: course.isActive ? '#DCFCE7' : 'var(--muted)',
                                            color: course.isActive ? '#166534' : 'var(--text-secondary)',
                                            textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>
                                            {course.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                                        {course.title}
                                    </h3>
                                    {course.inviteCode
                                        ? <CourseQr inviteCode={course.inviteCode} courseTitle={course.title} compact />
                                        : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin código</span>
                                    }
                                </div>

                                <div style={{
                                    marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--muted)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                                        <Users size={16} style={{ color: 'var(--border-strong)' }} />
                                        <span>{course.studentCount || 0} Estudiantes</span>
                                    </div>
                                    {/* Botón al monitor si hay sesiones activas */}
                                    {(liveCounts[course.id] ?? 0) > 0 ? (
                                        <Link
                                            href="/instructor/monitor"
                                            onClick={e => e.stopPropagation()}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                fontSize: 11, fontWeight: 700, color: 'var(--brand)',
                                                cursor: 'pointer',
                                            }}>
                                                <Radio size={12} />
                                                Ver sesiones →
                                            </span>
                                        </Link>
                                    ) : course.nextDeadline ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                                            <Calendar size={14} />
                                            <span>{formatDate(course.nextDeadline)}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <style jsx global>{`
                @keyframes live-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
                    50%       { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
                }
            `}</style>
        </div>
    );
}
