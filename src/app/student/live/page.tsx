'use client';

/**
 * /student/live — Monitor de sesiones en vivo para instructores (incluye role=USUARIO
 * asignado como instructor). Muestra SOLO las sesiones de los cursos donde el usuario
 * es instructor.
 *
 * Usa Firebase Realtime Database (no Firestore) para evitar errores 403:
 *   live_sessions/{institutionId}/{courseId}/{sessionId}  → metadata de sesión
 *   telemetry/{sessionId}                                 → telemetría en tiempo real
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import {
    subscribeLiveSessions,
    type LiveSessionEntry,
} from '@/shared/lib/rtdb-telemetry';
import { useAuth } from '@/hooks/use-auth';
import type { CourseModel } from '@/models/course';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { LiveSessionsGrid } from '@/components/live/live-sessions-grid';
import { BookOpen } from 'lucide-react';

export default function StudentLivePage() {
    const { user }                      = useAuth();
    const [courses, setCourses]         = useState<CourseModel[]>([]);
    const [sessions, setSessions]       = useState<LiveSessionEntry[]>([]);
    const [loading, setLoading]         = useState(true);
    const unsubsRef                     = useRef<(() => void)[]>([]);

    // sessionId → LiveSessionEntry para deduplicar
    const sessionMap = useRef(new Map<string, LiveSessionEntry>());

    const rebuildSessions = useCallback(() => {
        setSessions([...sessionMap.current.values()]);
    }, []);

    const subscribeToRtdb = useCallback((loadedCourses: CourseModel[]) => {
        unsubsRef.current.forEach(u => u());
        unsubsRef.current = [];
        sessionMap.current.clear();

        if (loadedCourses.length === 0) {
            setLoading(false);
            return;
        }

        // Por cada curso del instructor, suscribir a live_sessions/{institutionId}/{courseId}
        loadedCourses.forEach(course => {
            const institutionId = (course as any).institutionId as string | undefined;
            if (!institutionId) return;

            const unsub = subscribeLiveSessions(institutionId, course.id, (entries) => {
                // Quitar sesiones anteriores de este curso
                [...sessionMap.current.entries()].forEach(([sid, entry]) => {
                    if (entry.courseId === course.id) {
                        sessionMap.current.delete(sid);
                    }
                });
                // Agregar las activas
                entries.forEach(entry => {
                    if (entry.sessionId) {
                        sessionMap.current.set(entry.sessionId, entry);
                    }
                });
                rebuildSessions();
                setLoading(false);
            });

            unsubsRef.current.push(unsub);
        });

        const hasAnyInstitution = loadedCourses.some(c => !!(c as any).institutionId);
        if (!hasAnyInstitution) setLoading(false);
    }, [rebuildSessions]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        const load = async () => {
            try {
                const token = await getAuth().currentUser?.getIdToken();
                if (!token) { setLoading(false); return; }
                const res = await fetch('/api/instructor/courses', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (cancelled) return;
                if (!res.ok) { console.error(json.error); setLoading(false); return; }
                const data: CourseModel[] = json.courses || [];
                setCourses(data);
                subscribeToRtdb(data);
            } catch {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
            unsubsRef.current.forEach(u => u());
            unsubsRef.current = [];
        };
    }, [user, subscribeToRtdb]);

    const total = sessions.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Sesiones en Vivo" />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <PageHero
                    title="Sesiones en Vivo"
                    subtitle="Telemetría BLE en tiempo real de tus cursos · AHA 2025"
                    parentTitle="Mis cursos instructor"
                    parentHref="/student/instructor-courses"
                />

                {/* Barra de estado */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        {total > 0 && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: total > 0 ? '#10B981' : 'var(--text-muted)' }}>
                            {total} SESIÓN{total !== 1 ? 'ES' : ''} ACTIVA{total !== 1 ? 'S' : ''}
                        </span>
                    </div>
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: 'var(--brand)', fontSize: 12, fontWeight: 700,
                    }}>
                        <BookOpen size={13} /> {courses.length} curso{courses.length !== 1 ? 's' : ''} monitoreado{courses.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <LiveSessionsGrid
                    sessions={sessions}
                    loading={loading}
                    emptyMessage={courses.length === 0
                        ? 'No tienes cursos asignados como instructor todavía.'
                        : `Monitoreando ${courses.length} curso${courses.length !== 1 ? 's' : ''}. Cuando un estudiante inicie una práctica BLE, aparecerá aquí en tiempo real.`}
                />
            </div>
        </div>
    );
}
