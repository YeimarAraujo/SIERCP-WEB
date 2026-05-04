'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import Link from 'next/link';
import { BookOpen, Users, ChevronRight, GraduationCap } from 'lucide-react';

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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Mis Cursos" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader 
                    title="Mis Cursos" 
                    subtitle="Programas de capacitación en los que estás inscrito" 
                />

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: 120, background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E4F0', animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 20, padding: 64, textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <GraduationCap size={48} style={{ color: '#E2E4F0', marginBottom: 16 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>No estás inscrito en ningún curso</h3>
                        <p style={{ color: '#64748B', fontSize: 14, maxWidth: 300, margin: '0 auto' }}>
                            Contacta a tu instructor para obtener un código de invitación.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                        {courses.map((course) => (
                            <Link key={course.id} href={`/student/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 16, padding: 20,
                                    transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.borderColor = '#1800AD';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = '#E2E4F0';
                                }}
                                >
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD' }}>
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{course.title}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
                                                    <Users size={12} />
                                                    <span>{course.studentCount} compañeros</span>
                                                </div>
                                                <span style={{ fontSize: 10, color: '#CBD5E1' }}>•</span>
                                                <span style={{ fontSize: 12, color: '#1800AD', fontWeight: 600 }}>{course.certification}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} style={{ color: '#E2E4F0' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
