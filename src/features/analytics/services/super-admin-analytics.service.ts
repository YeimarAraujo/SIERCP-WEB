'use client';

import {
    collection,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp,
    where,
    doc,
    type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { ROLE_ADMIN, ROLE_INSTRUCTOR, ROLE_STUDENT } from '@/shared/lib/constants';

export interface AnalyticsTrendPoint {
    month: string;
    sessions: number;
    users: number;
    certificates: number;
}

export interface AnalyticsRankingItem {
    id: string;
    name: string;
    value: number;
    secondary?: string;
}

export interface AnalyticsActivityItem {
    id: string;
    title: string;
    detail: string;
    timestamp: Date;
    severity?: 'info' | 'warning' | 'critical';
}

export interface LicenseStatusSummary {
    active: number;
    pending: number;
    suspended: number;
    utilizationPct: number;
}

export interface SuperAdminAnalytics {
    generatedAt: Date;
    source: 'stats' | 'fallback';
    totals: {
        institutions: number;
        activeInstitutions: number;
        users: number;
        admins: number;
        instructors: number;
        students: number;
        sessions: number;
        certificates: number;
        activeCourses: number;
    };
    growth: {
        usersMonthlyPct: number;
        sessionsMonthlyPct: number;
        certificatesMonthlyPct: number;
    };
    trends: AnalyticsTrendPoint[];
    topInstitutions: AnalyticsRankingItem[];
    topCourses: AnalyticsRankingItem[];
    recentActivity: AnalyticsActivityItem[];
    recentSessions: AnalyticsActivityItem[];
    licenses: LicenseStatusSummary;
    alerts: AnalyticsActivityItem[];
}

const emptyAnalytics: SuperAdminAnalytics = {
    generatedAt: new Date(),
    source: 'fallback',
    totals: {
        institutions: 0,
        activeInstitutions: 0,
        users: 0,
        admins: 0,
        instructors: 0,
        students: 0,
        sessions: 0,
        certificates: 0,
        activeCourses: 0,
    },
    growth: {
        usersMonthlyPct: 0,
        sessionsMonthlyPct: 0,
        certificatesMonthlyPct: 0,
    },
    trends: [],
    topInstitutions: [],
    topCourses: [],
    recentActivity: [],
    recentSessions: [],
    licenses: {
        active: 0,
        pending: 0,
        suspended: 0,
        utilizationPct: 0,
    },
    alerts: [],
};

function toDate(value: unknown): Date {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    return new Date();
}

async function safeCount(collectionName: string, ...constraints: QueryConstraint[]): Promise<number> {
    try {
        const snap = await getCountFromServer(query(collection(db, collectionName), ...constraints));
        return snap.data().count;
    } catch {
        return 0;
    }
}

function normalizeTrend(raw: unknown): AnalyticsTrendPoint[] {
    if (!Array.isArray(raw)) return [];
    return raw.slice(-12).map((item) => ({
        month: String(item.month || item.label || '-'),
        sessions: Number(item.sessions || 0),
        users: Number(item.users || 0),
        certificates: Number(item.certificates || 0),
    }));
}

function normalizeRanking(raw: unknown): AnalyticsRankingItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 8).map((item) => ({
        id: String(item.id || item.name || Math.random().toString(36).slice(2)),
        name: String(item.name || item.title || 'Sin nombre'),
        value: Number(item.value || item.count || item.students || 0),
        secondary: item.secondary ? String(item.secondary) : undefined,
    }));
}

async function getStatsDocument(): Promise<Partial<SuperAdminAnalytics> | null> {
    try {
        const snap = await getDoc(doc(db, 'stats', 'global'));
        if (!snap.exists()) return null;
        const data = snap.data();

        return {
            source: 'stats',
            generatedAt: toDate(data.generatedAt || data.updatedAt),
            totals: { ...emptyAnalytics.totals, ...(data.totals || {}) },
            growth: { ...emptyAnalytics.growth, ...(data.growth || {}) },
            trends: normalizeTrend(data.trends),
            topInstitutions: normalizeRanking(data.topInstitutions),
            topCourses: normalizeRanking(data.topCourses),
            licenses: { ...emptyAnalytics.licenses, ...(data.licenses || {}) },
            alerts: normalizeRanking(data.alerts).map((item) => ({
                id: item.id,
                title: item.name,
                detail: item.secondary || 'Alerta registrada en stats/global',
                timestamp: new Date(),
                severity: 'warning',
            })),
        };
    } catch {
        return null;
    }
}

export const SuperAdminAnalyticsService = {
    async getDashboard(): Promise<SuperAdminAnalytics> {
        if (!db) return emptyAnalytics;

        const stats = await getStatsDocument();

        const [
            institutions,
            activeInstitutions,
            users,
            admins,
            instructors,
            students,
            sessions,
            certificates,
            activeCourses,
            pendingInstitutions,
            suspendedInstitutions,
        ] = await Promise.all([
            safeCount('institutions'),
            safeCount('institutions', where('status', '==', 'active')),
            safeCount('users'),
            safeCount('users', where('role', '==', ROLE_ADMIN)),
            safeCount('users', where('role', '==', ROLE_INSTRUCTOR)),
            safeCount('users', where('role', '==', ROLE_STUDENT)),
            safeCount('sessions'),
            safeCount('certificates'),
            safeCount('courses', where('isActive', '==', true)),
            safeCount('institutions', where('status', '==', 'pending')),
            safeCount('institutions', where('status', '==', 'suspended')),
        ]);

        const [recentSessionsSnap, auditSnap, courseSnap, institutionSnap] = await Promise.all([
            getDocs(query(collection(db, 'sessions'), orderBy('startedAt', 'desc'), limit(8))).catch(() => null),
            getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(8))).catch(() => null),
            getDocs(query(collection(db, 'courses'), where('isActive', '==', true), orderBy('studentCount', 'desc'), limit(8))).catch(() => null),
            getDocs(query(collection(db, 'institutions'), limit(8))).catch(() => null),
        ]);

        const recentSessions = recentSessionsSnap?.docs.map((item) => {
            const data = item.data();
            const score = Number(data.metrics?.qualityScore || data.metrics?.score || 0);
            return {
                id: item.id,
                title: data.studentName || 'Sesion clinica',
                detail: `${data.scenarioTitle || data.courseTitle || 'Entrenamiento'} - ${Math.round(score)}% calidad`,
                timestamp: toDate(data.startedAt),
                severity: score >= 85 ? 'info' : 'warning',
            } satisfies AnalyticsActivityItem;
        }) || [];

        const recentActivity = auditSnap?.docs.map((item) => {
            const data = item.data();
            return {
                id: item.id,
                title: String(data.action || 'Actividad'),
                detail: `${data.actor?.name || data.actor?.email || 'Sistema'} - ${data.resource || 'recurso'}`,
                timestamp: toDate(data.timestamp),
                severity: data.severity || 'info',
            } satisfies AnalyticsActivityItem;
        }) || [];

        const topCourses = stats?.topCourses?.length
            ? stats.topCourses
            : courseSnap?.docs.map((item) => {
                const data = item.data();
                return {
                    id: item.id,
                    name: String(data.title || 'Curso sin nombre'),
                    value: Number(data.studentCount || 0),
                    secondary: data.instructorName ? String(data.instructorName) : undefined,
                };
            }) || [];

        const topInstitutions = stats?.topInstitutions?.length
            ? stats.topInstitutions
            : institutionSnap?.docs.map((item) => {
                const data = item.data();
                return {
                    id: item.id,
                    name: String(data.name || item.id),
                    value: Number(data.maxStudents || 0),
                    secondary: `${data.plan || 'basic'} - ${data.status || 'pending'}`,
                };
            }) || [];

        const utilizationPct = topInstitutions.length
            ? Math.round((students / Math.max(topInstitutions.reduce((sum, item) => sum + item.value, 0), 1)) * 100)
            : 0;

        const alerts: AnalyticsActivityItem[] = [
            ...(stats?.alerts || []),
            ...(suspendedInstitutions > 0 ? [{
                id: 'suspended-institutions',
                title: 'Instituciones suspendidas',
                detail: `${suspendedInstitutions} instituciones requieren revision comercial o soporte.`,
                timestamp: new Date(),
                severity: 'critical' as const,
            }] : []),
            ...(recentSessions.some((item) => item.severity === 'warning') ? [{
                id: 'low-quality-sessions',
                title: 'Sesiones bajo estándar',
                detail: 'Hay sesiones recientes por debajo del umbral recomendado.',
                timestamp: new Date(),
                severity: 'warning' as const,
            }] : []),
        ].slice(0, 6);

        return {
            ...emptyAnalytics,
            ...stats,
            source: stats ? 'stats' : 'fallback',
            generatedAt: stats?.generatedAt || new Date(),
            totals: {
                ...emptyAnalytics.totals,
                ...(stats?.totals || {}),
                institutions,
                activeInstitutions,
                users,
                admins,
                instructors,
                students,
                sessions,
                certificates,
                activeCourses,
            },
            growth: {
                ...emptyAnalytics.growth,
                ...(stats?.growth || {}),
            },
            trends: stats?.trends?.length ? stats.trends : this.buildFallbackTrend(recentSessions),
            topInstitutions,
            topCourses,
            recentActivity,
            recentSessions,
            licenses: {
                active: activeInstitutions,
                pending: pendingInstitutions,
                suspended: suspendedInstitutions,
                utilizationPct,
            },
            alerts,
        };
    },

    buildFallbackTrend(recentSessions: AnalyticsActivityItem[]): AnalyticsTrendPoint[] {
        const buckets = new Map<string, AnalyticsTrendPoint>();
        const formatter = new Intl.DateTimeFormat('es-CO', { month: 'short' });
        for (let i = 5; i >= 0; i -= 1) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = formatter.format(date);
            buckets.set(key, { month: key, sessions: 0, users: 0, certificates: 0 });
        }
        recentSessions.forEach((item) => {
            const key = formatter.format(item.timestamp);
            const bucket = buckets.get(key);
            if (bucket) bucket.sessions += 1;
        });
        return Array.from(buckets.values());
    },
};
