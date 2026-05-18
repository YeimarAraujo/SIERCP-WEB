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

async function getActiveUsersToday(): Promise<{ count: number; source: string }> {
    const today = Timestamp.fromDate(startOfToday());

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

async function getCoursesWithActivity(): Promise<{ count: number; source: string }> {
    const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    try {
        const snap = await getDocs(query(
            collection(db, 'sessions'),
            where('startedAt', '>=', sevenDaysAgo),
            limit(200),
        ));
        const courseIds = new Set<string>();
        snap.docs.forEach((item) => {
            const courseId = item.data().courseId;
            if (courseId) courseIds.add(String(courseId));
        });
        if (courseIds.size > 0) {
            return { count: courseIds.size, source: 'sessions.courseId últimos 7 días' };
        }
    } catch {
        // Fallback below.
    }

    const activeCourses = await safeCount('courses', [where('isActive', '==', true)]);
    return {
        count: activeCourses,
        source: activeCourses > 0 ? 'courses.isActive' : 'sessions/courses sin actividad',
    };
}

export const OperationalMetricsService = {
    async getMetrics(): Promise<OperationalMetrics> {
        if (!db) {
            return { generatedAt: new Date(), metrics: [] };
        }

        const last24h = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
        const monthStart = Timestamp.fromDate(startOfMonth());

        const [
            sessions24h,
            activeUsers,
            activeCourses,
            certificatesMonth,
        ] = await Promise.all([
            safeCount('sessions', [where('startedAt', '>=', last24h)]),
            getActiveUsersToday(),
            getCoursesWithActivity(),
            safeCount('certificates', [where('issuedAt', '>=', monthStart)]),
        ]);

        return {
            generatedAt: new Date(),
            metrics: [
                {
                    key: 'sessions24h',
                    label: 'Sesiones últimas 24h',
                    value: sessions24h,
                    subtitle: sessions24h > 0 ? 'Actividad reciente detectada' : 'Sin sesiones registradas en 24h',
                    status: sessions24h > 0 ? 'active' : 'empty',
                    source: 'sessions.startedAt',
                },
                {
                    key: 'activeUsersToday',
                    label: 'Usuarios activos hoy',
                    value: activeUsers.count,
                    subtitle: activeUsers.count > 0 ? 'Usuarios con acceso reciente' : 'Sin logins/actividad registrada hoy',
                    status: activeUsers.count > 0 ? 'active' : 'empty',
                    source: activeUsers.source,
                },
                {
                    key: 'activeCourses',
                    label: 'Cursos con actividad',
                    value: activeCourses.count,
                    subtitle: activeCourses.source.includes('sessions') ? 'Cursos con sesiones recientes' : 'Cursos activos en operación',
                    status: activeCourses.count > 0 ? 'neutral' : 'empty',
                    source: activeCourses.source,
                },
                {
                    key: 'certificatesMonth',
                    label: 'Certificados emitidos',
                    value: certificatesMonth,
                    subtitle: certificatesMonth > 0 ? 'Emitidos este mes' : 'Colección preparada; sin emisiones este mes',
                    status: certificatesMonth > 0 ? 'neutral' : 'empty',
                    source: 'certificates.issuedAt',
                },
            ],
        };
    },
};
