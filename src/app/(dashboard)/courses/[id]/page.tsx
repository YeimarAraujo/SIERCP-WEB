'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { SessionCard } from '@/components/sessions/session-card';
import { CourseService, SessionService } from '@/services/firestore.service';
import { formatDate } from '@/lib/utils';
import type { CourseModel, Enrollment } from '@/models/course';
import type { SessionModel } from '@/models/session';

export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<CourseModel | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [tab, setTab] = useState<'info' | 'students' | 'sessions'>('info');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            CourseService.get(id),
            CourseService.getEnrollments(id),
            SessionService.getByCourse(id),
        ]).then(([c, e, s]) => {
            setCourse(c);
            setEnrollments(e);
            setSessions(s);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
    if (!course) return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Curso no encontrado.</p></div>;

    return (
        <div className="flex flex-col h-full">
            <Header title={course.title} />
            <div className="flex-1 overflow-y-auto">

                {/* Course header */}
                <div className="border-b border-border bg-card px-6 py-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Instructor: {course.instructorName}</span>
                        <span>Certificación: {course.certification}</span>
                        <span>Puntaje requerido: {course.requiredScore}pts</span>
                        <span>Código: <span className="font-mono font-medium">{course.inviteCode}</span></span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-6">
                    {(['info', 'students', 'sessions'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {t === 'info' ? 'Información' : t === 'students' ? `Estudiantes (${enrollments.length})` : `Sesiones (${sessions.length})`}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-4">
                    {tab === 'info' && (
                        <div className="space-y-4">
                            {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    { label: 'Estudiantes', value: course.studentCount },
                                    { label: 'Módulos totales', value: course.totalModules },
                                    { label: 'Creado', value: formatDate(course.createdAt) },
                                    { label: 'Modo de escenario', value: course.scenarioMode },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-lg border border-border bg-card p-4">
                                        <p className="text-xs text-muted-foreground">{label}</p>
                                        <p className="font-semibold mt-1">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'students' && (
                        <div className="space-y-2">
                            {enrollments.length === 0
                                ? <p className="text-sm text-muted-foreground">No hay estudiantes matriculados.</p>
                                : enrollments.map((e) => (
                                    <div key={e.studentId} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium">{e.studentName}</p>
                                            <p className="text-xs text-muted-foreground">{e.studentEmail}</p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            <p>{e.sessionCount} sesiones</p>
                                            <p>Prom: {e.avgScore.toFixed(1)}pts</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {tab === 'sessions' && (
                        <div className="space-y-2">
                            {sessions.length === 0
                                ? <p className="text-sm text-muted-foreground">No hay sesiones en este curso.</p>
                                : sessions.map((s) => <SessionCard key={s.id} session={s} />)
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}