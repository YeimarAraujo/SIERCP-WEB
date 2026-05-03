'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/stores/auth-store';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import Link from 'next/link';

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        CourseService.getAll().then(setCourses).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <PageHeader title="Cursos" subtitle="Cursos disponibles para ti" />

            {loading ? (
                <p style={{ color: '#8892A4', fontSize: 13 }}>Cargando...</p>
            ) : courses.length === 0 ? (
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    padding: 40,
                    textAlign: 'center',
                }}>
                    <p style={{ color: '#8892A4' }}>No hay cursos disponibles</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {courses.map((course) => (
                        <Link key={course.id} href={`/student/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E4F0',
                                borderRadius: 12,
                                padding: 16,
                            }}>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#0B1C30', margin: '0 0 4px' }}>
                                    {course.title}
                                </p>
                                <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>
                                    {course.studentCount} estudiantes
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
