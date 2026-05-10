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
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700, fontSize: 12 }}>
                        {row.studentName?.charAt(0) ?? ''}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.studentName}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{row.studentEmail}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'courseName',
            label: 'Curso',
            render: (_: unknown, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#1800AD' }}>
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                    {row.completedModules} módulos
                </div>
            )
        },
        {
            key: 'enrolledAt',
            label: 'Fecha Registro',
            render: (_: unknown, row: any) => (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{formatDate(row.enrolledAt)}</div>
            )
        },
    ];

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100%', padding: '24px 32px' }}>
            <PageHero
                title="Estudiantes"
                subtitle="Administración de matrículas y rendimiento académico"
                parentTitle="Instructor"
                parentHref="/instructor/dashboard"
                actions={
                    <>
                        <button onClick={() => router.push('/admin/students/import')} style={{
                            padding: '10px 18px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <Download size={16} /> Importar CSV
                        </button>
                    </>
                }
            />

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'flex-end' }}>
                <button
                    onClick={() => router.push('/admin/students/import')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                    <Upload size={16} /> Importar CSV
                </button>
                <button
                    onClick={() => router.push('/instructor/courses')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#1800AD', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(24, 0, 173, 0.3)' }}
                >
                    <UserPlus size={16} /> Gestionar Cursos
                </button>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                        type="text"
                        placeholder="Buscar alumno, correo o curso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={filteredStudents}
                    loading={loading}
                    emptyMessage="No se encontraron estudiantes registrados."
                />
            </div>
        </div>
    );
}
