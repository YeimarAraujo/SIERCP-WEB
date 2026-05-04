'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import { Edit2, Trash2, Plus } from 'lucide-react';

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        CourseService.getAll()
            .then(setCourses)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Gestión de cursos" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <PageHeader
                        title="Gestión de cursos"
                        subtitle="Administra todos los cursos de la plataforma"
                    />
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#1800AD',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}>
                        <Plus size={16} />
                        Nuevo curso
                    </button>
                </div>

                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E4F0',
                    borderRadius: 12,
                    overflow: 'hidden',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{
                                background: '#F0F1FA',
                                color: '#4A5568',
                                fontSize: 11,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Nombre del Curso</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Instructor</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Alumnos</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Estado</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i}>
                                        <td colSpan={5} style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ height: 20, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 2s infinite' }} />
                                        </td>
                                    </tr>
                                ))
                            ) : courses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#8892A4' }}>
                                        No hay cursos registrados o activos
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{course.title}</div>
                                            <div style={{ fontSize: 11, color: '#64748B' }}>{course.certification}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                                            {course.instructorName}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>
                                            {course.studentCount}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: '2px 8px',
                                                borderRadius: 12,
                                                background: course.isActive ? '#DCFCE7' : '#F1F5F9',
                                                color: course.isActive ? '#166534' : '#64748B'
                                            }}>
                                                {course.isActive ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                <button style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
