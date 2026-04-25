'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import { formatDate } from '@/lib/utils';
import type { CourseModel } from '@/models/course';

export default function CoursesPage() {
    const { user, isInstructor } = useAuth();
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchFn = isInstructor
            ? () => CourseService.getByInstructor(user.uid)
            : () => CourseService.getAll();
        fetchFn().then(setCourses).finally(() => setLoading(false));
    }, [user, isInstructor]);

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !joinCode.trim()) return;
        setJoinError('');
        setJoining(true);
        try {
            const course = await CourseService.getByInviteCode(joinCode.trim());
            if (!course) { setJoinError('Código inválido o curso no encontrado.'); return; }
            await CourseService.enroll(course.id, {
                studentId: user.uid,
                studentName: `${user.firstName} ${user.lastName}`,
                studentEmail: user.email,
                identificacion: user.identificacion,
                enrolledAt: new Date(),
                completedModules: 0,
                avgScore: 0,
                sessionCount: 0,
                status: 'active',
            });
            const updated = await CourseService.getAll();
            setCourses(updated);
            setJoinCode('');
        } catch (err) {
            setJoinError('Error al unirse al curso.');
        } finally {
            setJoining(false);
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Cursos" />
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                {/* Join course (students only) */}
                {!isInstructor && (
                    <form onSubmit={handleJoin} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                            <label className="text-sm font-medium">Unirse con código de invitación</label>
                            <input
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                maxLength={6}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            {joinError && <p className="text-xs text-destructive">{joinError}</p>}
                        </div>
                        <button
                            type="submit" disabled={joining || joinCode.length < 6}
                            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {joining ? 'Uniéndose...' : 'Unirse'}
                        </button>
                    </form>
                )}

                {/* Courses grid */}
                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            {isInstructor ? 'No has creado cursos aún.' : 'No estás inscrito en ningún curso.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                className="rounded-lg border border-border bg-card p-5 hover:bg-accent/50 transition-colors space-y-2"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-sm leading-snug">{course.title}</p>
                                    <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                        {course.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{course.certification}</p>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{course.studentCount} estudiantes</span>
                                    <span>Código: <span className="font-mono font-medium">{course.inviteCode}</span></span>
                                </div>
                                {course.nextDeadline && (
                                    <p className="text-xs text-muted-foreground">
                                        Próx. entrega: {course.nextDeadlineTitle} — {formatDate(course.nextDeadline)}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}