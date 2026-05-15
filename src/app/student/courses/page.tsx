'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import Link from 'next/link';
import { BookOpen, Users, ChevronRight, GraduationCap, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

export default function StudentCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        CourseService.getByStudent(user.uid)
            .then(setCourses)
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Mis Cursos" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Mis Cursos" 
                    subtitle="Programas de capacitación clínica y certificaciones AHA" 
                    parentTitle="Estudiante"
                    parentHref="/student/home"
                />

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: 140, background: 'var(--card)', borderRadius: 24, border: '1px solid var(--border)', animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div style={{ 
                        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 32, 
                        padding: '80px 32px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        maxWidth: 600, margin: '40px auto'
                    }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border-strong)', margin: '0 auto 24px' }}>
                            <GraduationCap size={40} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', marginBottom: 12 }}>No estás inscrito en ningún curso</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                            Parece que aún no tienes matrículas activas. Contacta a tu instructor o institución para obtener un código de invitación y comenzar tu formación.
                        </p>
                        <Link href="/student/home" style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', 
                            background: 'var(--brand)', color: 'var(--text-on-brand)', borderRadius: 12, fontWeight: 700, 
                            textDecoration: 'none', transition: 'all 0.2s'
                        }}>
                            Ir al Panel Principal <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                        {courses.map((course) => (
                            <Link key={course.id} href={`/student/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'var(--brand)';
                                    e.currentTarget.style.boxShadow = '0 12px 20px -10px rgba(24, 0, 173, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                }}
                                >
                                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                        <div style={{ 
                                            width: 56, height: 56, borderRadius: 16, background: 'var(--accent)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' 
                                        }}>
                                            <BookOpen size={28} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{course.title}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                    <Users size={14} />
                                                    <span>{course.studentCount}</span>
                                                </div>
                                                <span style={{ fontSize: 10, color: 'var(--border-strong)' }}>•</span>
                                                <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{course.certification}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} style={{ color: 'var(--border-strong)' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
