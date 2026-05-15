'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { Mail, Calendar, User, Activity, BookOpen, Users, TrendingUp, GraduationCap } from 'lucide-react';
import { UserService } from '@/services/firestore.service';
import { CourseService } from '@/shared/lib/firestore.service';
import { getFullName } from '@/shared/types/user';
import type { UserModel } from '@/shared/types/user';
import type { CourseModel } from '@/shared/types/course';

export default function InstructorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const uid = params.uid as string;
    
    const [instructor, setInstructor] = useState<UserModel | null>(null);
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) return;
        
        Promise.all([
            UserService.get(uid),
            CourseService.getByInstructor(uid)
        ]).then(([userData, coursesData]) => {
            if (!userData) {
                router.push('/admin/instructors');
                return;
            }
            setInstructor(userData as UserModel);
            setCourses(coursesData as CourseModel[]);
        }).catch(() => {
            router.push('/admin/instructors');
        }).finally(() => setLoading(false));
    }, [uid, router]);

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading || !instructor) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    const totalStudents = courses.reduce((acc, c) => acc + (c.studentCount || 0), 0);
    const activeCourses = courses.filter(c => c.isActive).length;

    const courseColumns = [
        {
            key: 'title',
            label: 'Curso',
            render: (_: any, row: CourseModel) => (
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{row.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.certification}</div>
                </div>
            )
        },
        {
            key: 'studentCount',
            label: 'Estudiantes',
            render: (_: any, row: CourseModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 600, color: 'var(--brand)' }}>{row.studentCount || 0}</span>
                </div>
            )
        },
        {
            key: 'moduleCount',
            label: 'Módulos',
            render: (_: any, row: CourseModel) => (
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.moduleCount || 0}</span>
            )
        },
        {
            key: 'minScore',
            label: 'Puntaje Mín.',
            render: (_: any, row: CourseModel) => (
                <span style={{ fontWeight: 700, color: '#10B981' }}>{row.minScore}%</span>
            )
        },
        {
            key: 'isActive',
            label: 'Estado',
            render: (val: boolean) => (
                <span style={{
                    fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
                    background: val ? '#DCFCE720' : '#FEE2E220', color: val ? '#166534' : '#991B1B', letterSpacing: '0.05em'
                }}>
                    {val ? 'ACTIVO' : 'INACTIVO'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Acciones',
            render: (_: any, row: CourseModel) => (
                <Link href={`/instructor/courses/${row.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                        padding: '6px 12px', borderRadius: 8, background: 'var(--muted)', border: 'none',
                        color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}>
                        Ver Detalle
                    </button>
                </Link>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Detalles del Instructor" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title={getFullName(instructor)}
                    subtitle={`Perfil académico y gestión de cursos`}
                    parentTitle="Instructores"
                    parentHref="/admin/instructors"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginTop: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Información Personal
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Nombre completo</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{getFullName(instructor)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Mail size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Correo electrónico</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{instructor.email}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fecha de registro</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{formatDate(instructor.createdAt)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: instructor.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Activity size={18} color={instructor.status === 'ACTIVE' ? '#166534' : '#92400E'} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Estado</div>
                                        <div style={{ 
                                            fontWeight: 700, fontSize: 14, 
                                            color: instructor.status === 'ACTIVE' ? '#166534' : '#92400E' 
                                        }}>
                                            {instructor.status === 'ACTIVE' ? 'Activo' : 'Pendiente'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Estadísticas
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>{courses.length}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cursos</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{activeCourses}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Activos</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--clr-accent)' }}>{totalStudents}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Estudiantes</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>{instructor.stats?.totalSessions || 0}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sesiones</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <Link href={`/admin/instructors/${uid}/edit`} style={{ flex: 1, textDecoration: 'none' }}>
                                <button style={{ 
                                    width: '100%', padding: '12px', borderRadius: 12, background: 'var(--brand)', 
                                    color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, cursor: 'pointer' 
                                }}>
                                    Editar
                                </button>
                            </Link>
                            <button style={{ 
                                padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', 
                                color: '#DC2626', border: '1px solid #FEE2E2', fontWeight: 700, cursor: 'pointer' 
                            }}>
                                Eliminar
                            </button>
                        </div>
                    </div>

                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Cursos Asignados ({courses.length})
                        </h3>
                        
                        <DataTable
                            columns={courseColumns}
                            data={courses}
                            loading={loading}
                            emptyMessage="No hay cursos asignados a este instructor."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}