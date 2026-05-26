'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel, Enrollment } from '@/models/course';
import { 
    ArrowLeft, BookOpen, Users, Clock, Award, FileText, 
    Settings, Trash2, Edit2, Download, Search, Calendar,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import toast from 'react-hot-toast';
import { 
    collection, getDocs, query, where, orderBy, limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminCourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.uid as string;
    
    const [course, setCourse] = useState<CourseModel | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!courseId) return;
        
        Promise.all([
            CourseService.get(courseId, true),
            getEnrollments(courseId)
        ])
        .then(([courseData, enrollData]) => {
            setCourse(courseData);
            setEnrollments(enrollData);
        })
        .catch((err) => {
            console.error(err);
            toast.error('Error al cargar el curso');
        })
        .finally(() => setLoading(false));
    }, [courseId]);

    const getEnrollments = async (cid: string): Promise<Enrollment[]> => {
        const snap = await getDocs(
            query(
                collection(db, 'courses', cid, 'enrollments'),
                orderBy('enrolledAt', 'desc')
            )
        );
        return snap.docs.map(d => ({
            studentId: d.id,
            ...d.data(),
            enrolledAt: d.data().enrolledAt?.toDate() || new Date()
        } as Enrollment));
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                background: 'var(--muted)'
            }}>
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid var(--border)',
                    borderTop: '3px solid var(--brand)',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                background: 'var(--muted)',
                gap: 16
            }}>
                <AlertCircle size={48} color="#DC2626" />
                <h2 style={{ color: 'var(--foreground)', fontSize: 20, fontWeight: 700 }}>
                    Curso no encontrado
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    El curso con ID {courseId} no existe o fue eliminado.
                </p>
                <button 
                    onClick={() => router.push('/admin/courses')}
                    style={{
                        marginTop: 16,
                        padding: '10px 20px',
                        background: 'var(--brand)',
                        color: 'var(--text-on-brand)',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Volver a Cursos
                </button>
            </div>
        );
    }

    const filteredEnrollments = enrollments.filter(e =>
        searchTerm === '' ||
        e.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.identificacion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = enrollments.filter(e => e.status === 'active').length;
    const completedCount = enrollments.filter(e => e.status === 'completed').length;
    const avgScore = enrollments.length > 0 
        ? enrollments.reduce((sum, e) => sum + (e.avgScore || 0), 0) / enrollments.length 
        : 0;

    const columns = [
        {
            key: 'studentName',
            label: 'Estudiante',
            render: (_: any, row: Enrollment) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                        width: 36, height: 36, borderRadius: '50%', 
                        background: 'var(--muted)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--brand)', fontWeight: 700, fontSize: 14
                    }}>
                        {row.studentName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: 14 }}>
                            {row.studentName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.studentEmail}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'identificacion',
            label: 'Identificación',
            render: (val: any) => (
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {val || '—'}
                </span>
            )
        },
        {
            key: 'completedModules',
            label: 'Progreso',
            render: (_: any, row: Enrollment) => {
                const total = course.totalModules || 1;
                const pct = Math.round((row.completedModules / total) * 100);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                            width: 80, height: 6, borderRadius: 3, 
                            background: 'var(--border)', overflow: 'hidden' 
                        }}>
                            <div style={{ 
                                width: `${pct}%`, height: '100%', 
                                background: pct >= 100 ? '#10B981' : 'var(--brand)',
                                borderRadius: 3
                            }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {pct}%
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'avgScore',
            label: 'Promedio',
            render: (val: any) => (
                <span style={{ 
                    fontWeight: 700, fontSize: 14,
                    color: val >= (course.requiredScore || 70) ? '#10B981' : '#F59E0B'
                }}>
                    {val?.toFixed(1) || '0.0'}%
                </span>
            )
        },
        {
            key: 'sessionCount',
            label: 'Sesiones',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} color="var(--text-muted)" />
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{val || 0}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Estado',
            render: (val: any) => (
                <span style={{ 
                    fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
                    background: val === 'completed' ? '#DCFCE7' : '#FEF3C7',
                    color: val === 'completed' ? '#166534' : '#92400E',
                    letterSpacing: '0.05em'
                }}>
                    {val === 'completed' ? 'COMPLETADO' : 'ACTIVO'}
                </span>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión Académica" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title={course.title}
                    subtitle={`Certificación: ${course.certification}`}
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button 
                                onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
                                style={{
                                    padding: '10px 16px', borderRadius: 12, 
                                    background: 'var(--card)', color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)', fontSize: 13, 
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', 
                                    alignItems: 'center', gap: 8
                                }}
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                            <button 
                                onClick={() => {
                                    if (enrollments.length === 0) return toast.error('No hay inscripciones');
                                    const csv = [
                                        ['Nombre', 'Email', 'Identificación', 'Progreso', 'Promedio', 'Estado'].join(','),
                                        ...enrollments.map(e => [
                                            e.studentName, e.studentEmail, e.identificacion || '',
                                            `${Math.round((e.completedModules / (course.totalModules || 1)) * 100)}%`,
                                            e.avgScore?.toFixed(1) || '0', e.status
                                        ].join(','))
                                    ].join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `inscripciones-${course.title.toLowerCase().replace(/\s+/g, '-')}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success('Inscripciones exportadas');
                                }}
                                style={{
                                    padding: '10px 16px', borderRadius: 12, 
                                    background: 'var(--brand)', color: 'var(--text-on-brand)',
                                    border: 'none', fontSize: 13, 
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', 
                                    alignItems: 'center', gap: 8,
                                    boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                                }}
                            >
                                <Download size={16} /> Exportar
                            </button>
                        </div>
                    }
                />

                <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 20, marginBottom: 24 
                }}>
                    <div style={{ 
                        background: 'var(--card)', borderRadius: 16, padding: 20,
                        border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ 
                                width: 40, height: 40, borderRadius: 10, 
                                background: 'var(--accent)', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center',
                                color: 'var(--brand)'
                            }}>
                                <Users size={20} />
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Inscritos</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>
                            {enrollments.length}
                        </div>
                    </div>

                    <div style={{ 
                        background: 'var(--card)', borderRadius: 16, padding: 20,
                        border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ 
                                width: 40, height: 40, borderRadius: 10, 
                                background: '#DCFCE7', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center',
                                color: '#10B981'
                            }}>
                                <CheckCircle size={20} />
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Activos</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>
                            {activeCount}
                        </div>
                    </div>

                    <div style={{ 
                        background: 'var(--card)', borderRadius: 16, padding: 20,
                        border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ 
                                width: 40, height: 40, borderRadius: 10, 
                                background: '#FEF3C7', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center',
                                color: '#F59E0B'
                            }}>
                                <Award size={20} />
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Completados</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>
                            {completedCount}
                        </div>
                    </div>

                    <div style={{ 
                        background: 'var(--card)', borderRadius: 16, padding: 20,
                        border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ 
                                width: 40, height: 40, borderRadius: 10, 
                                background: 'var(--muted)', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)'
                            }}>
                                <BookOpen size={20} />
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Promedio</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>
                            {avgScore.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <div style={{ 
                    background: 'var(--card)', border: '1px solid var(--border)', 
                    borderRadius: 24, padding: 24, 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
                }}>
                    <div style={{ 
                        display: 'flex', justifyContent: 'space-between', 
                        alignItems: 'center', marginBottom: 24, gap: 20 
                    }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                            Inscripciones
                        </h3>
                        <div style={{ position: 'relative', maxWidth: 300 }}>
                            <Search size={18} style={{ 
                                position: 'absolute', left: 16, top: '50%', 
                                transform: 'translateY(-50%)', color: 'var(--text-muted)' 
                            }} />
                            <input
                                type="text"
                                placeholder="Buscar estudiante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', height: 44, padding: '0 16px 0 48px', 
                                    borderRadius: 12, border: '1px solid var(--border)',
                                    fontSize: 14, outline: 'none', background: 'var(--muted)'
                                }}
                            />
                        </div>
                    </div>

                    <DataTable 
                        columns={columns}
                        data={filteredEnrollments}
                        loading={loading}
                        emptyMessage="No hay inscripciones en este curso."
                    />
                </div>
            </div>
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}