'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { UserService } from '@/services/firestore.service';
import { SessionService, CourseService } from '@/shared/lib/firestore.service';
import { getFullName } from '@/shared/types/user';
import type { UserModel } from '@/shared/types/user';
import type { SessionModel } from '@/shared/types/session';
import type { CourseModel } from '@/shared/types/course';
import { Mail, Calendar, User, Activity, BookOpen, Users, GraduationCap, Award, Clock } from 'lucide-react';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const uid = params.uid as string;
    
    const [user, setUser] = useState<UserModel | null>(null);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) return;
        
        const userPromise = UserService.get(uid);
        
        userPromise.then((userData) => {
            if (!userData) {
                router.push('/admin/users');
                return;
            }
            const u = userData as UserModel;
            setUser(u);
            
            if (['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL'].includes(u.role)) {
                Promise.all([
                    SessionService.getByStudent(uid, 10),
                    CourseService.getByStudent(uid)
                ]).then(([sess, crs]) => {
                    setSessions(sess as SessionModel[]);
                    setCourses(crs as CourseModel[]);
                });
            } else if (u.role === 'INSTRUCTOR') {
                CourseService.getByInstructor(uid).then((crs) => {
                    setCourses(crs as CourseModel[]);
                });
            }
        }).catch(() => {
            router.push('/admin/users');
        }).finally(() => setLoading(false));
    }, [uid, router]);

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const roleColors: Record<string, string> = {
        'USUARIO': '#10B981',
        'USUARIO_SST': '#059669',
        'USUARIO_PROFESIONAL': '#1800AD',
        'INSTRUCTOR': 'var(--clr-accent)',
        'ADMIN': '#F59E0B',
        'SUPER_ADMIN': '#EF4444',
    };

    const roleLabels: Record<string, string> = {
        'USUARIO': 'Usuario',
        'USUARIO_SST': 'Usuario SST',
        'USUARIO_PROFESIONAL': 'Usuario Profesional',
        'INSTRUCTOR': 'Instructor',
        'ADMIN': 'Administrador',
        'SUPER_ADMIN': 'Super Admin',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Detalles del Usuario" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title={getFullName(user)}
                    subtitle={`Gestión de ${roleLabels[user.role]}`}
                    parentTitle="Usuarios"
                    parentHref="/admin/users"
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
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{getFullName(user)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Mail size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Correo electrónico</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{user.email}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fecha de registro</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{formatDate(user.createdAt)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: roleColors[user.role] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Activity size={18} color={roleColors[user.role]} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rol</div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: roleColors[user.role] }}>
                                            {roleLabels[user.role]}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: user.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Activity size={18} color={user.status === 'ACTIVE' ? '#166534' : '#92400E'} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Estado</div>
                                        <div style={{ 
                                            fontWeight: 700, fontSize: 14, 
                                            color: user.status === 'ACTIVE' ? '#166534' : '#92400E' 
                                        }}>
                                            {user.status === 'ACTIVE' ? 'Activo' : 'Pendiente'}
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
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>{user.stats?.totalSessions || 0}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sesiones</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{Math.round(user.stats?.averageScore || 0)}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Promedio</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>{user.stats?.bestScore || 0}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mejor Nota</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--clr-accent)' }}>{user.stats?.streakDays || 0}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Racha</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <Link href={`/admin/users/${uid}/edit`} style={{ flex: 1, textDecoration: 'none' }}>
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

                    <div>
                        {['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL'].includes(user.role) && (
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Sesiones Recientes ({sessions.length})
                                </h3>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {sessions.length === 0 ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No hay sesiones registradas</div>
                                    ) : (
                                        sessions.map((s) => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 12, background: 'var(--muted)' }}>
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
                        )}

                        {(['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL', 'INSTRUCTOR'] as string[]).includes(user.role) && (
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginTop: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Cursos ({courses.length})
                                </h3>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {courses.length === 0 ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            {['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL'].includes(user.role) ? 'No hay cursos matriculados' : 'No hay cursos asignados'}
                                        </div>
                                    ) : (
                                        courses.map((c) => (
                                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 12, background: 'var(--muted)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{c.title}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.certification}</div>
                                                </div>
                                                <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20, background: c.isActive ? '#DCFCE720' : '#FEE2E220', color: c.isActive ? '#166534' : '#991B1B' }}>
                                                    {c.isActive ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}