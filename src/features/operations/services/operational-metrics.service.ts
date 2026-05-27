'use client';

import {
    collection,
    getCountFromServer,
    getDocs,
    limit,
    query,
    Timestamp,
    where,
    type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';

export interface OperationalMetric {
    key: 'sessions24h' | 'activeUsersToday' | 'activeCourses' | 'certificatesMonth';
    label: string;
    value: number;
    subtitle: string;
    status: 'active' | 'neutral' | 'empty' | 'warning';
    source: string;
}

export interface OperationalMetrics {
    generatedAt: Date;
    metrics: OperationalMetric[];
}

async function safeCount(collectionName: string, constraints: QueryConstraint[]): Promise<number> {
    try {
        const snap = await getCountFromServer(query(collection(db, collectionName), ...constraints));
        return snap.data().count;
    } catch {
        return 0;
    }
}

function startOfToday(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

function startOfMonth(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
}

async function getActiveUsersToday(institutionId?: string): Promise<{ count: number; source: string }> {
    const today = Timestamp.fromDate(startOfToday());

    if (institutionId) {
        // Institution-scoped: unique users from today's sessions in this institution
        try {
            const snap = await getDocs(query(
                collection(db, 'sessions'),
                where('institutionId', '==', institutionId),
                where('startedAt', '>=', today),
                limit(500),
            ));
            const userIds = new Set<string>();
            snap.docs.forEach(d => {
                const data = d.data();
                const uid = data.userId || data.studentId;
                if (uid) userIds.add(String(uid));
            });
            return { count: userIds.size, source: 'sesiones de hoy' };
        } catch {
            return { count: 0, source: 'sin actividad hoy' };
        }
    }

    const lastLoginCount = await safeCount('users', [where('lastLogin', '>=', today)]);
    if (lastLoginCount > 0) {
        return { count: lastLoginCount, source: 'users.lastLogin' };
    }

    try {
        const snap = await getDocs(query(
            collection(db, 'auditLogs'),
            where('timestamp', '>=', today),
            limit(200),
        ));
        const userIds = new Set<string>();
        snap.docs.forEach((item) => {
            const data = item.data();
            const action = String(data.action || '');
            const uid = data.actor?.uid ? String(data.actor.uid) : '';
            if ((action === 'auth.login' || action.startsWith('auth.')) && uid) {
                userIds.add(uid);
            }
        });
        return { count: userIds.size, source: 'auditLogs.auth' };
    } catch {
        return { count: 0, source: 'users.lastLogin/auditLogs no disponible' };
    }
}

async function getCoursesWithActivity(institutionId?: string): Promise<{ count: number; source: string }> {
    const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const constraints: QueryConstraint[] = [where('startedAt', '>=', sevenDaysAgo), limit(200)];
    if (institutionId) constraints.unshift(where('institutionId', '==', institutionId));

    try {
        const snap = await getDocs(query(collection(db, 'sessions'), ...constraints));
        const courseIds = new Set<string>();
        snap.docs.forEach((item) => {
            const courseId = item.data().courseId;
            if (courseId) courseIds.add(String(courseId));
        });
        if (courseIds.size > 0) {
            return { count: courseIds.size, source: 'sesiones últimos 7 días' };
        }
    } catch {
        // Fallback below.
    }

    const activeCourseConstraints: QueryConstraint[] = [where('isActive', '==', true)];
    if (institutionId) activeCourseConstraints.push(where('institutionId', '==', institutionId));
    const activeCourses = await safeCount('courses', activeCourseConstraints);
    return {
        count: activeCourses,
        source: activeCourses > 0 ? 'cursos activos' : 'sin actividad reciente',
    };
}

export const OperationalMetricsService = {
    async getMetrics(institutionId?: string): Promise<OperationalMetrics> {
        if (!db) {
            return { generatedAt: new Date(), metrics: [] };
        }

        const last24h = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
        const monthStart = Timestamp.fromDate(startOfMonth());

        const sessions24hConstraints: QueryConstraint[] = [where('startedAt', '>=', last24h)];
        if (institutionId) sessions24hConstraints.unshift(where('institutionId', '==', institutionId));

        const certificatesConstraints: QueryConstraint[] = [where('issuedAt', '>=', monthStart)];
        if (institutionId) certificatesConstraints.unshift(where('institutionId', '==', institutionId));

        const [
            sessions24h,
            activeUsers,
            activeCourses,
            certificatesMonth,
        ] = await Promise.all([
            safeCount('sessions', sessions24hConstraints),
            getActiveUsersToday(institutionId),
            getCoursesWithActivity(institutionId),
            safeCount('certificates', certificatesConstraints),
        ]);

        return {
            generatedAt: new Date(),
            metrics: [
                {
                    key: 'sessions24h',
                    label: 'Sesiones últimas 24h',
                    value: sessions24h,
                    subtitle: sessions24h > 0 ? 'Actividad reciente detectada' : 'Sin sesiones en 24h',
                    status: sessions24h > 0 ? 'active' : 'empty',
                    source: 'sessions.startedAt',
                },
                {
                    key: 'activeUsersToday',
                    label: 'Usuarios activos hoy',
                    value: activeUsers.count,
                    subtitle: activeUsers.count > 0 ? 'Con actividad hoy' : 'Sin actividad registrada hoy',
                    status: activeUsers.count > 0 ? 'active' : 'empty',
                    source: activeUsers.source,
                },
                {
                    key: 'activeCourses',
                    label: 'Cursos con actividad',
                    value: activeCourses.count,
                    subtitle: activeCourses.source.includes('sesion') ? 'Con sesiones recientes' : 'Cursos activos',
                    status: activeCourses.count > 0 ? 'neutral' : 'empty',
                    source: activeCourses.source,
                },
                {
                    key: 'certificatesMonth',
                    label: 'Certificados emitidos',
                    value: certificatesMonth,
                    subtitle: certificatesMonth > 0 ? 'Emitidos este mes' : 'Sin emisiones este mes',
                    status: certificatesMonth > 0 ? 'neutral' : 'empty',
                    source: 'certificates.issuedAt',
                },
            ],
        };
    },
};
