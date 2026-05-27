'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Upload, UserPlus, Mail, BookOpen, BarChart3, Search, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import type { Enrollment } from '@/models/course';
import { formatDate } from '@/lib/utils';
import { PageHero } from '@/components/ui/page-hero';

export default function InstructorStudentsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;

        const fetchStudents = async () => {
            try {
                setLoading(true);
                // 1. Get instructor's courses
                const courses = await CourseService.getByInstructor(user.uid);

                // 2. Fetch enrollments for each course
                const allEnrollments = await Promise.all(
                    courses.map(async (c) => {
                        const enrolls = await CourseService.getEnrollments(c.id);
                        return enrolls.map(e => ({
                            ...e,
                            courseName: c.title,
                            courseId: c.id
                        }));
                    })
                );

                const flattened = allEnrollments.flat();
                setStudents(flattened);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [user]);

    const filteredStudents = students.filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: any[] = [
        {
            key: 'studentName',
            label: 'Nombre',
            render: (_: unknown, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12 }}>
                        {row.studentName?.charAt(0) ?? ''}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{row.studentName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.studentEmail}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'courseName',
            label: 'Curso',
            render: (_: unknown, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
                    <BookOpen size={14} /> {row.courseName}
                </div>
            )
        },
        {
            key: 'avgScore',
            label: 'Calidad Avg',
            render: (_: unknown, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 800, color: (row.avgScore || 0) >= 85 ? '#10B981' : '#F59E0B' }}>
                        {(row.avgScore || 0).toFixed(1)}%
                    </div>
                </div>
            )
        },
        {
            key: 'completedModules',
            label: 'Progreso',
            render: (_: unknown, row: any) => (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {row.completedModules} módulos
                </div>
            )
        },
        {
            key: 'enrolledAt',
            label: 'Fecha Registro',
            render: (_: unknown, row: any) => (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(row.enrolledAt)}</div>
            )
        },
    ];

    return (
        <div style={{ background: 'var(--muted)', minHeight: '100%', padding: '24px 32px' }}>
            <PageHero
                title="Estudiantes"
                subtitle="Administración de matrículas y rendimiento académico"
                parentTitle="Instructor"
                parentHref="/instructor/dashboard"
                actions={
                    <>
                        <button onClick={() => router.push('/instructor/students/new')} style={{
                            padding: '10px 18px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <Download size={16} /> Nuevo estudiante
                        </button>
                        <button
                            onClick={() => router.push('/instructor/courses')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--brand)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--text-on-brand)', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(24, 0, 173, 0.3)' }}
                        >
                            <UserPlus size={16} /> Gestionar Cursos
                        </button>
                    </>
                }
            />


            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar alumno, correo o curso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={filteredStudents}
                    loading={loading}
                    onRowClick={(row) => router.push(`/instructor/students/${row.studentId}`)}
                    emptyMessage="No se encontraron estudiantes registrados."
                />
            </div>
        </div>
    );
}
