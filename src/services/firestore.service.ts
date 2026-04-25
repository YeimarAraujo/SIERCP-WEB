import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, serverTimestamp, Timestamp,
    type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserModel } from '@/models/user';
import type { SessionModel } from '@/models/session';
import type { CourseModel, Enrollment } from '@/models/course';
import type { ManiquiModel } from '@/models/device';

// ── Helpers ──────────────────────────────────────────────────────────────────
function tsToDate(val: unknown): Date {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    return new Date();
}

// ── Users ────────────────────────────────────────────────────────────────────
export const UserService = {
    async get(uid: string): Promise<UserModel | null> {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return null;
        const d = snap.data();
        return { ...d, uid: snap.id, createdAt: tsToDate(d.createdAt), updatedAt: tsToDate(d.updatedAt) } as UserModel;
    },

    async getAll(): Promise<UserModel[]> {
        const snaps = await getDocs(collection(db, 'users'));
        return snaps.docs.map((s) => {
            const d = s.data();
            return { ...d, uid: s.id, createdAt: tsToDate(d.createdAt), updatedAt: tsToDate(d.updatedAt) } as UserModel;
        });
    },

    async update(uid: string, data: Partial<UserModel>): Promise<void> {
        await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
    },

    async delete(uid: string): Promise<void> {
        await deleteDoc(doc(db, 'users', uid));
    },
};

// ── Sessions ─────────────────────────────────────────────────────────────────
function parseSession(id: string, d: Record<string, unknown>): SessionModel {
    return {
        ...d,
        id,
        startedAt: tsToDate(d.startedAt),
        endedAt: d.endedAt ? tsToDate(d.endedAt) : undefined,
    } as SessionModel;
}

export const SessionService = {
    async get(id: string): Promise<SessionModel | null> {
        const snap = await getDoc(doc(db, 'sessions', id));
        if (!snap.exists()) return null;
        return parseSession(snap.id, snap.data() as Record<string, unknown>);
    },

    async getByStudent(studentId: string, limitN = 20): Promise<SessionModel[]> {
        const constraints: QueryConstraint[] = [
            where('studentId', '==', studentId),
            orderBy('startedAt', 'desc'),
            limit(limitN),
        ];
        const snaps = await getDocs(query(collection(db, 'sessions'), ...constraints));
        return snaps.docs.map((s) => parseSession(s.id, s.data() as Record<string, unknown>));
    },

    async getByCourse(courseId: string): Promise<SessionModel[]> {
        const snaps = await getDocs(
            query(collection(db, 'sessions'), where('courseId', '==', courseId), orderBy('startedAt', 'desc')),
        );
        return snaps.docs.map((s) => parseSession(s.id, s.data() as Record<string, unknown>));
    },

    async create(session: Omit<SessionModel, 'id'>): Promise<string> {
        const ref = doc(collection(db, 'sessions'));
        await setDoc(ref, { ...session, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        return ref.id;
    },

    async update(id: string, data: Partial<SessionModel>): Promise<void> {
        await updateDoc(doc(db, 'sessions', id), { ...data, updatedAt: serverTimestamp() });
    },
};

// ── Courses ──────────────────────────────────────────────────────────────────
function parseCourse(id: string, d: Record<string, unknown>): CourseModel {
    return {
        ...d,
        id,
        createdAt: tsToDate(d.createdAt),
        updatedAt: tsToDate(d.updatedAt),
        nextDeadline: d.nextDeadline ? tsToDate(d.nextDeadline) : undefined,
    } as CourseModel;
}

export const CourseService = {
    async get(id: string): Promise<CourseModel | null> {
        const snap = await getDoc(doc(db, 'courses', id));
        if (!snap.exists()) return null;
        return parseCourse(snap.id, snap.data() as Record<string, unknown>);
    },

    async getByInstructor(instructorId: string): Promise<CourseModel[]> {
        const snaps = await getDocs(
            query(collection(db, 'courses'), where('instructorId', '==', instructorId)),
        );
        return snaps.docs.map((s) => parseCourse(s.id, s.data() as Record<string, unknown>));
    },

    async getAll(): Promise<CourseModel[]> {
        const snaps = await getDocs(query(collection(db, 'courses'), where('isActive', '==', true)));
        return snaps.docs.map((s) => parseCourse(s.id, s.data() as Record<string, unknown>));
    },

    async create(course: Omit<CourseModel, 'id'>): Promise<string> {
        const ref = doc(collection(db, 'courses'));
        await setDoc(ref, { ...course, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        return ref.id;
    },

    async update(id: string, data: Partial<CourseModel>): Promise<void> {
        await updateDoc(doc(db, 'courses', id), { ...data, updatedAt: serverTimestamp() });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'courses', id));
    },

    async getByInviteCode(code: string): Promise<CourseModel | null> {
        const snaps = await getDocs(
            query(collection(db, 'courses'), where('inviteCode', '==', code.toUpperCase()), limit(1)),
        );
        if (snaps.empty) return null;
        const s = snaps.docs[0];
        return parseCourse(s.id, s.data() as Record<string, unknown>);
    },

    async enroll(courseId: string, enrollment: Enrollment): Promise<void> {
        await setDoc(
            doc(db, 'courses', courseId, 'enrollments', enrollment.studentId),
            { ...enrollment, enrolledAt: serverTimestamp() },
        );
        await updateDoc(doc(db, 'courses', courseId), {
            studentCount: (await getDoc(doc(db, 'courses', courseId))).data()?.studentCount + 1 || 1,
            updatedAt: serverTimestamp(),
        });
    },

    async getEnrollments(courseId: string): Promise<Enrollment[]> {
        const snaps = await getDocs(collection(db, 'courses', courseId, 'enrollments'));
        return snaps.docs.map((s) => {
            const d = s.data();
            return { ...d, enrolledAt: tsToDate(d.enrolledAt) } as Enrollment;
        });
    },
};

// ── Manikins ─────────────────────────────────────────────────────────────────
export const ManiquiService = {
    async getAll(): Promise<ManiquiModel[]> {
        const snaps = await getDocs(collection(db, 'manikins'));
        return snaps.docs.map((s) => {
            const d = s.data();
            return {
                ...d,
                id: s.id,
                lastConnection: d.lastConnection ? tsToDate(d.lastConnection) : undefined,
                updatedAt: tsToDate(d.updatedAt),
            } as ManiquiModel;
        });
    },

    async update(id: string, data: Partial<ManiquiModel>): Promise<void> {
        await updateDoc(doc(db, 'manikins', id), { ...data, updatedAt: serverTimestamp() });
    },
};