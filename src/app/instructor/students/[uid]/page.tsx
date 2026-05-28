'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { UserService, CourseService, SessionService } from '@/services/firestore.service';
import { useAuth } from '@/hooks/use-auth';
import { getFullName } from '@/models/user';
import type { UserModel } from '@/models/user';
import type { Enrollment } from '@/models/course';
import type { SessionModel } from '@/models/session';
import { Mail, Calendar, User, Activity, BookOpen, Users, Award, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorStudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const uid = params.uid as string;
    
    const [student, setStudent] = useState<UserModel | null>(null);
    const [enrollments, setEnrollments] = useState<(Enrollment & { courseId: string; courseTitle: string })[]>([]);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid || !user) return;
        
        const fetchData = async () => {
            try {
                const studentData = await UserService.get(uid);
                if (!studentData || !['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL'].includes(studentData.role)) {
                    router.push('/instructor/students');
                    return;
                }
                
                const instructorCourses = await CourseService.getByInstructor(user.uid);
                const courseIds = instructorCourses.map(c => c.id);
                
                const allEnrollments: (Enrollment & { courseId: string; courseTitle: string })[] = [];
                const enrollmentResults = await Promise.all(
                    instructorCourses.map(async (course) => {
                        const enrolls = await CourseService.getEnrollments(course.id);
                        return enrolls.filter(e => e.studentId === uid).map(en => ({
                            ...en, courseId: course.id, courseTitle: course.title,
                        }));
                    })
                );
                for (const batch of enrollmentResults) {
                    for (const en of batch) allEnrollments.push(en);
                }
                
                const sessionsData = await SessionService.getByStudent(uid, 10);
                
                setStudent(studentData as UserModel);
                setEnrollments(allEnrollments);
                setSessions(sessionsData as SessionModel[]);
            } catch (err) {
                router.push('/instructor/students');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [uid, user, router]);

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading || !student) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Detalle del Estudiante" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title={getFullName(student)}
                    subtitle={`Estudiante matriculado en tus cursos`}
                    parentTitle="Estudiantes"
                    parentHref="/instructor/students"
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
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{getFullName(student)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Mail size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Correo electrónico</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{student.email}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fecha de registro</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{formatDate(student.createdAt)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: student.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Activity size={18} color={student.status === 'ACTIVE' ? '#166534' : '#92400E'} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Estado</div>
                                        <div style={{ 
                                            fontWeight: 700, fontSize: 14, 
                                            color: student.status === 'ACTIVE' ? '#166534' : '#92400E' 
                                        }}>
                                            {student.status === 'ACTIVE' ? 'Activo' : 'Pendiente'}
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
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>{enrollments.length}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cursos</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{Math.round(student.stats?.averageScore || 0)}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Promedio</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>{student.stats?.bestScore || 0}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mejor Nota</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--clr-accent)' }}>{sessions.length}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sesiones</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button 
                                onClick={() => router.push(`/instructor/students/${uid}/edit`)}
                                style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Editar
                            </button>
                            <button 
                                onClick={() => {
                                    if (confirm('¿Desmatricular al estudiante de todos tus cursos?')) {
                                        toast.success('Estudiante desmatriculado');
                                    }
                                }}
                                style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Desmatricular
                            </button>
                        </div>
                    </div>

                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Cursos Matriculados ({enrollments.length})
                        </h3>
                        
                        <div style={{ display: 'grid', gap: 16 }}>
                            {enrollments.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No hay cursos matriculados
                                </div>
                            ) : (
                                enrollments.map((en) => (
                                    <div key={en.studentId + en.courseId} style={{ padding: '20px', borderRadius: 16, background: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 15 }}>{en.courseTitle || 'Curso'}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Matriculado: {formatDate(en.enrolledAt)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, color: en.avgScore >= 85 ? '#10B981' : '#F59E0B', fontSize: 18 }}>
                                                {en.avgScore.toFixed(1)}%
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{en.completedModules} módulos</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ marginTop: 32 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Sesiones Recientes ({sessions.length})
                            </h3>
                            
                            <div style={{ display: 'grid', gap: 12 }}>
                                {sessions.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No hay sesiones registradas
                                    </div>
                                ) : (
                                    sessions.slice(0, 5).map((s) => (
                                        <div key={s.id} style={{ padding: '16px', borderRadius: 12, background: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{s.scenarioTitle || 'Sin título'}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(s.startedAt)}</div>
                                            </div>
                                            <div style={{ fontWeight: 800, color: (s.metrics?.qualityScore || 0) >= 85 ? '#10B981' : '#F59E0B' }}>
                                                {s.metrics?.qualityScore || 0}%
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}