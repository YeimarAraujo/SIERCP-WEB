'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    collection, query, where, orderBy, limit,
    getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';

export type CalendarEventType =
    | 'quiz'
    | 'session'
    | 'certificate'
    | 'plan_expiry'
    | 'course';

export interface CalendarEvent {
    id: string;
    title: string;
    subtitle?: string;
    date: Date;
    type: CalendarEventType;
    href?: string;
    passed?: boolean;
    score?: number;
}

function toDate(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Timestamp) return v.toDate();
    if (v instanceof Date) return v;
    if (typeof v === 'string' || typeof v === 'number') {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

// ─── Hook usuario / instructor ────────────────────────────────────────────────
// Uses getDocs (one-time fetch) instead of onSnapshot to avoid Firestore
// watch-stream assertion errors caused by React StrictMode's double-invoke of
// useEffect (rapid subscribe → unsubscribe → subscribe trips the "ca9" assertion
// inside TargetState.We in watch_change.ts).
export function useCalendar(userId: string | null | undefined) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async (uid: string, signal: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const [quizSnap, sessSnap, certSnap] = await Promise.all([
                getDocs(query(
                    collection(db, 'quizSessions'),
                    where('userId', '==', uid),
                    orderBy('createdAt', 'desc'),
                    limit(60)
                )),
                getDocs(query(
                    collection(db, 'sessions'),
                    where('userId', '==', uid),
                    orderBy('startedAt', 'desc'),
                    limit(60)
                )),
                getDocs(query(
                    collection(db, 'certificates'),
                    where('userId', '==', uid),
                    orderBy('issuedAt', 'desc'),
                    limit(30)
                )),
            ]);

            if (signal.aborted) return;

            const result: CalendarEvent[] = [];

            quizSnap.docs.forEach((doc) => {
                const d = doc.data();
                const date = toDate(d.createdAt);
                if (!date) return;
                result.push({
                    id: doc.id,
                    title: d.topicTitle ?? 'Evaluación teórica',
                    subtitle: `${d.score ?? 0}% · ${d.passed ? 'Aprobado' : 'No aprobado'}`,
                    date,
                    type: 'quiz',
                    passed: d.passed ?? false,
                    score: d.score ?? 0,
                });
            });

            sessSnap.docs.forEach((doc) => {
                const d = doc.data();
                const date = toDate(d.startedAt) ?? toDate(d.completedAt);
                if (!date) return;
                result.push({
                    id: doc.id,
                    title: d.scenarioTitle ?? 'Sesión práctica',
                    subtitle: d.status === 'completed' ? `Score: ${d.score ?? 0}%` : 'En progreso',
                    date,
                    type: 'session',
                    passed: (d.score ?? 0) >= 70,
                    score: d.score ?? 0,
                });
            });

            certSnap.docs.forEach((doc) => {
                const d = doc.data();
                const date = toDate(d.issuedAt);
                if (!date) return;
                result.push({
                    id: doc.id,
                    title: d.courseTitle ?? 'Certificado',
                    subtitle: 'Certificado emitido',
                    date,
                    type: 'certificate',
                    passed: true,
                });
            });

            result.sort((a, b) => b.date.getTime() - a.date.getTime());
            setEvents(result);
        } catch (e: unknown) {
            if (signal.aborted) return;
            const msg = e instanceof Error ? e.message : 'Error al cargar calendario';
            setError(msg);
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        fetch(userId, controller.signal);
        return () => controller.abort();
    }, [userId, fetch]);

    const refresh = useCallback(() => {
        if (userId) {
            const controller = new AbortController();
            fetch(userId, controller.signal);
        }
    }, [userId, fetch]);

    return { events, loading, error, refresh };
}

// ─── Hook admin (institución completa) ────────────────────────────────────────
export function useAdminCalendar(institutionId: string | null | undefined) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async (instId: string, signal: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const [sessSnap, certSnap, quizSnap] = await Promise.all([
                getDocs(query(
                    collection(db, 'sessions'),
                    where('institutionId', '==', instId),
                    orderBy('startedAt', 'desc'),
                    limit(100)
                )),
                getDocs(query(
                    collection(db, 'certificates'),
                    where('institutionId', '==', instId),
                    orderBy('issuedAt', 'desc'),
                    limit(60)
                )),
                getDocs(query(
                    collection(db, 'quizSessions'),
                    where('institutionId', '==', instId),
                    orderBy('createdAt', 'desc'),
                    limit(100)
                )),
            ]);

            if (signal.aborted) return;

            const result: CalendarEvent[] = [];

            sessSnap.docs.forEach((doc) => {
                const d = doc.data();
                const date = toDate(d.startedAt) ?? toDate(d.completedAt);
                if (!date) return;
                result.push({
                    id: doc.id,
                    title: d.scenarioTitle ?? 'Sesión práctica',
                    subtitle: d.studentName ?? '',
                    date,
                    type: 'session',
                    passed: (d.score ?? 0) >= 70,
                    score: d.score ?? 0,
                });
            });

            certSnap.docs.forEach((doc) => {
                const d = doc.data();
                const date = toDate(d.issuedAt);
                if (!date) return;
                result.push({
                    id: doc.id,
                    title: d.courseTitle ?? 'Certificado',
                    subtitle: d.studentName ?? 'Estudiante',
                    date,
                    type: 'certificate',
                    passed: true,
                });
            });

            quizSnap.docs.forEach((doc) => {
                const d = doc.data();
                const date = toDate(d.createdAt);
                if (!date) return;
                result.push({
                    id: doc.id,
                    title: d.topicTitle ?? 'Evaluación teórica',
                    subtitle: d.userName ?? '',
                    date,
                    type: 'quiz',
                    passed: d.passed ?? false,
                    score: d.score ?? 0,
                });
            });

            result.sort((a, b) => b.date.getTime() - a.date.getTime());
            setEvents(result);
        } catch (e: unknown) {
            if (signal.aborted) return;
            const msg = e instanceof Error ? e.message : 'Error al cargar calendario';
            setError(msg);
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!institutionId) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        fetch(institutionId, controller.signal);
        return () => controller.abort();
    }, [institutionId, fetch]);

    const refresh = useCallback(() => {
        if (institutionId) {
            const controller = new AbortController();
            fetch(institutionId, controller.signal);
        }
    }, [institutionId, fetch]);

    return { events, loading, error, refresh };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function eventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
        const key = dateKey(e.date);
        const existing = map.get(key) ?? [];
        existing.push(e);
        map.set(key, existing);
    });
    return map;
}

export function dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const EVENT_COLORS: Record<CalendarEventType, string> = {
    quiz:        'var(--brand)',
    session:     '#ef4444',
    certificate: '#10b981',
    plan_expiry: '#f59e0b',
    course:      '#8b5cf6',
};
