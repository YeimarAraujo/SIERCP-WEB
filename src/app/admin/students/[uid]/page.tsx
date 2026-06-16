'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { ArrowLeft, Mail, CreditCard, Calendar, Award, BookOpen, Clock, TrendingUp, User, Activity } from 'lucide-react';
import { UserService } from '@/services/firestore.service';
import { SessionService } from '@/shared/lib/firestore.service';
import { getFullName, getUserInitials } from '@/shared/types/user';
import type { UserModel } from '@/shared/types/user';
import type { SessionModel } from '@/shared/types/session';

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const uid = params.uid as string;
    
    const [student, setStudent] = useState<UserModel | null>(null);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) return;
        
        Promise.all([
            UserService.get(uid),
            SessionService.getByStudent(uid, 100)
        ]).then(([userData, sessionsData]) => {
            setStudent(userData as UserModel);
            setSessions(sessionsData as SessionModel[]);
        }).catch(() => {
            router.push('/admin/students');
        }).finally(() => setLoading(false));
    }, [uid, router]);

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (loading || !student) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    const stats = student.stats;
    const avgScore = stats?.averageScore ? Math.round(stats.averageScore) : 0;
    const bestScore = stats?.bestScore || 0;
    const totalHours = stats?.totalHours ? Math.round(stats.totalHours * 10) / 10 : 0;

    const sessionColumns = [
        {
            key: 'startedAt',
            label: 'Fecha',
            render: (_: any, row: SessionModel) => formatDate(row.startedAt)
        },
        {
            key: 'scenarioTitle',
            label: 'Escenario',
            render: (_: any, row: SessionModel) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{row.scenarioTitle || 'Sin título'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.courseTitle || 'Sin curso'}</div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Estado',
            render: (val: string) => {
                const colors: Record<string, string> = {
                    completed: '#10B981',
                    active: 'var(--brand)',
                    aborted: '#EF4444',
                    pending: '#F59E0B'
                };
                const labels: Record<string, string> = {
                    completed: 'COMPLETADA',
                    active: 'ACTIVA',
                    aborted: 'ABORTADA',
                    pending: 'PENDIENTE'
                };
                return (
                    <span style={{
                        fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
                        background: `${colors[val]}20`, color: colors[val], letterSpacing: '0.05em'
                    }}>
                        {labels[val] || val}
                    </span>
                );
            }
        },
        {
            key: 'duration',
            label: 'Duración',
            render: (_: any, row: SessionModel) => formatDuration(row.duration)
        },
        {
            key: 'qualityScore',
            label: 'Puntuación',
            render: (_: any, row: SessionModel) => {
                const score = row.metrics?.qualityScore || 0;
                const passed = score >= 85;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 40, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${score}%`, height: '100%',
                                background: passed ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444'
                            }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: passed ? '#10B981' : 'var(--text-secondary)' }}>
                            {score}%
                        </span>
                    </div>
                );
            }
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Detalles del Estudiante" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title={getFullName(student)}
                    subtitle={`Perfil académico y estadísticas de rendimiento`}
                    parentTitle="Estudiantes"
                    parentHref="/admin/students"
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
                                        <CreditCard size={18} color="var(--brand)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Identificación</div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{student.identification || '—'}</div>
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
                                Estadísticas de Rendimiento
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>{stats?.totalSessions || 0}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sesiones</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: avgScore >= 85 ? '#10B981' : '#F59E0B' }}>{avgScore}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Promedio</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{bestScore}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mejor nota</div>
                                </div>
                                <div style={{ background: 'var(--muted)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-secondary)' }}>{totalHours}h</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Horas</div>
                                </div>
                            </div>

                            {stats?.streakDays && stats.streakDays > 0 && (
                                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#FEF3C7', borderRadius: 12 }}>
                                    <TrendingUp size={16} color="#92400E" />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
                                        Racha de {stats.streakDays} días
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Historial de Sesiones ({sessions.length})
                        </h3>
                        
                        <DataTable
                            columns={sessionColumns}
                            data={sessions}
                            loading={loading}
                            emptyMessage="No hay sesiones registradas para este estudiante."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}