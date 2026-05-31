'use client';

/**
 * /student/instructor-courses
 * Cursos donde el usuario actúa como instructor — dentro del student shell.
 * Usa RTDB para live counts (evita 403 de Firestore para rol USUARIO).
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { subscribeLiveSessions } from '@/shared/lib/rtdb-telemetry';
import { useAuth } from '@/hooks/use-auth';
import type { CourseModel } from '@/models/course';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    BookOpen, Users, Calendar, Radio, Monitor,
    ChevronRight, GraduationCap, UserCheck,
} from 'lucide-react';
import { CourseQr } from '@/components/ui/course-qr';
import { formatDate } from '@/lib/utils';

export default function StudentInstructorCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);
    // courseId → número de sesiones activas (de RTDB, sin 403)
    const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
    const unsubsRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        const load = async () => {
            try {
                const token = await getAuth().currentUser?.getIdToken();
                if (!token) { setLoading(false); return; }

                // API server-side: cursos por instructorId + por membership de institución
                const res = await fetch('/api/instructor/courses', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (cancelled) return;
                if (!res.ok) { console.error(json.error); setLoading(false); return; }

                const data: CourseModel[] = json.courses || [];
                setCourses(data);
                setLoading(false);

                // Limpiar suscripciones anteriores
                unsubsRef.current.forEach(u => u());
                unsubsRef.current = [];

                // Suscribir a RTDB live_sessions (sin Firestore → sin 403)
                data.forEach(course => {
                    const institutionId = (course as any).institutionId as string | undefined;
                    if (!institutionId) return;

                    const unsub = subscribeLiveSessions(institutionId, course.id, (entries) => {
                        setLiveCounts(prev => ({ ...prev, [course.id]: entries.length }));
                    });
                    unsubsRef.current.push(unsub);
                });
            } catch (e) {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
            unsubsRef.current.forEach(u => u());
            unsubsRef.current = [];
        };
    }, [user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Cursos como Instructor" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Mis Cursos como Instructor"
                    subtitle="Programas que estás dirigiendo en tus instituciones asignadas"
                    parentTitle="Inicio"
                    parentHref="/student/home"
                    actions={
                        <Link href="/student/live" style={{ textDecoration: 'none' }}>
                            <button style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 18px', borderRadius: 12,
                                background: 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.3)',
                                color: '#10B981', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            }}>
                                <Monitor size={16} /> Monitor en Vivo
                            </button>
                        </Link>
                    }
                />

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: 200, borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <EmptyInstructor />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {courses.map(course => (
                            <InstructorCourseCard
                                key={course.id}
                                course={course}
                                liveCount={liveCounts[course.id] ?? 0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function InstructorCourseCard({ course, liveCount }: { course: CourseModel; liveCount: number }) {
    const [hov, setHov] = useState(false);

    return (
        <Link
            href={`/student/instructor-courses/${course.id}`}
            style={{ textDecoration: 'none' }}
        >
            <div
                style={{
                    background: 'var(--card)',
                    border: `1.5px solid ${hov ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.15)'}`,
                    borderRadius: 20, padding: 22,
                    display: 'flex', flexDirection: 'column', gap: 16,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    transform: hov ? 'translateY(-3px)' : 'none',
                    boxShadow: hov ? '0 8px 24px rgba(16,185,129,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'rgba(16,185,129,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BookOpen size={22} style={{ color: '#10B981' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {liveCount > 0 && (
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 10,
                                background: '#ECFDF5', color: '#10B981',
                                border: '1px solid rgba(16,185,129,0.25)',
                            }}>
                                <Radio size={10} /> {liveCount} VIVO
                            </span>
                        )}
                        <span style={{
                            fontSize: 10, fontWeight: 800, padding: '5px 11px', borderRadius: 10,
                            background: course.isActive ? '#DCFCE7' : 'var(--muted)',
                            color: course.isActive ? '#166534' : 'var(--text-secondary)',
                        }}>
                            {course.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>

                {/* Título */}
                <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>
                        {course.title}
                    </h3>
                    {course.inviteCode && (
                        <CourseQr inviteCode={course.inviteCode} courseTitle={course.title} compact />
                    )}
                </div>

                {/* Badge instructor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={12} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>INSTRUCTOR ASIGNADO</span>
                </div>

                {/* Footer */}
                <div style={{
                    paddingTop: 14, borderTop: '1px solid var(--muted)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                        <Users size={15} />
                        <span>{course.studentCount ?? 0} Estudiantes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>
                        Gestionar <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </Link>
    );
}

function EmptyInstructor() {
    return (
        <div style={{
            background: 'var(--card)', border: '1px dashed rgba(16,185,129,0.3)',
            borderRadius: 24, padding: '80px 40px', textAlign: 'center',
        }}>
            <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(16,185,129,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
            }}>
                <GraduationCap size={32} style={{ color: 'rgba(16,185,129,0.5)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>
                Sin cursos asignados como instructor
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
                Cuando un administrador te asigne como instructor en un curso, aparecerá aquí.
            </p>
        </div>
    );
}
