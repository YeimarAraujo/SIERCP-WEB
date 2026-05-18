'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import { formatDate } from '@/lib/utils';
import type { CourseModel } from '@/models/course';
import { BookOpen, Users, Key, Calendar, Plus } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

export default function InstructorCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchCourses = async () => {
            try {
                setLoading(true);
                const data = await CourseService.getByInstructor(user.uid);
                setCourses(data);
            } catch (error) {
                console.error('Error fetching instructor courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
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
                                    <span style={{
                                        fontSize: 10, fontWeight: 800, padding: '6px 12px', borderRadius: 10,
                                        background: course.isActive ? '#DCFCE7' : 'var(--muted)',
                                        color: course.isActive ? '#166534' : 'var(--text-secondary)',
                                        textTransform: 'uppercase', letterSpacing: '0.05em'
                                    }}>
                                        {course.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                                        {course.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--muted)', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--muted)' }}>
                                        <Key size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Código:</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand)', fontSize: 14 }}>{course.inviteCode}</span>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--muted)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                                        <Users size={16} style={{ color: 'var(--border-strong)' }} />
                                        <span>{course.studentCount || 0} Estudiantes</span>
                                    </div>
                                    {course.nextDeadline && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                                            <Calendar size={14} />
                                            <span>{formatDate(course.nextDeadline)}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
