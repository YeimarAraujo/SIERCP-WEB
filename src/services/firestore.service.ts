import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
    query, where, orderBy, limit, serverTimestamp, Timestamp,
    type QueryConstraint, collectionGroup, getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserModel } from '@/models/user';
import type { SessionModel } from '@/models/session';
import type { CourseModel, Enrollment } from '@/models/course';
import type { ManiquiModel } from '@/models/device';
import type { GuideModel } from '@/models/guide';

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
function parseSession(id: string, d: Record<string, any>): SessionModel {
    // Standardize metrics naming
    if (d.metrics) {
        d.metrics.qualityScore = d.metrics.qualityScore ?? d.metrics.score ?? 0;
        d.metrics.averageDepthMm = d.metrics.averageDepthMm ?? d.metrics.avgDepthMm ?? 0;
        d.metrics.averageRatePerMin = d.metrics.averageRatePerMin ?? d.metrics.avgRatePerMin ?? 0;
    }
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
            query(collection(db, 'sessions'), where('courseId', '==', courseId)),
        );
        return snaps.docs
            .map((s) => parseSession(s.id, s.data() as Record<string, unknown>))
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
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
function parseCourse(id: string, d: Record<string, any>): CourseModel {
    return {
        ...d,
        id,
        minScore: d.minScore ?? d.requiredScore ?? 85,
        moduleCount: d.moduleCount ?? d.totalModules ?? 0,
        createdAt: tsToDate(d.createdAt),
        updatedAt: tsToDate(d.updatedAt),
        nextDeadline: d.nextDeadline ? tsToDate(d.nextDeadline) : undefined,
    } as CourseModel;
}

export const CourseService = {
    async get(id: string): Promise<CourseModel | null> {
        const snap = await getDoc(doc(db, 'courses', id));
        if (!snap.exists()) return null;
        const data = snap.data() as Record<string, unknown>;
        const countSnap = await getCountFromServer(collection(db, 'courses', id, 'enrollments'));
        return parseCourse(snap.id, { ...data, studentCount: countSnap.data().count });
    },

    async getByInstructor(instructorId: string): Promise<CourseModel[]> {
        const snaps = await getDocs(
            query(collection(db, 'courses'), where('instructorId', '==', instructorId)),
        );
        return Promise.all(snaps.docs.map(async (s) => {
            const data = s.data() as Record<string, unknown>;
            const countSnap = await getCountFromServer(collection(db, 'courses', s.id, 'enrollments'));
            return parseCourse(s.id, { ...data, studentCount: countSnap.data().count });
        }));
    },

    async getByStudent(studentId: string): Promise<CourseModel[]> {
        // Query all "enrollments" subcollections across all courses
        const snaps = await getDocs(
            query(collectionGroup(db, 'enrollments'), where('studentId', '==', studentId))
        );
        
        // Extract course IDs from the parent path
        const courseIds = snaps.docs.map(d => d.ref.parent.parent?.id).filter(Boolean) as string[];
        
        if (courseIds.length === 0) return [];
        
        // Fetch all courses in parallel
        const courses = await Promise.all(courseIds.map(id => this.get(id)));
        return courses;
    },

    async getAll(): Promise<CourseModel[]> {
        const snaps = await getDocs(query(collection(db, 'courses'), where('isActive', '==', true)));
        return Promise.all(snaps.docs.map(async (s) => {
            const data = s.data() as Record<string, unknown>;
            const countSnap = await getCountFromServer(collection(db, 'courses', s.id, 'enrollments'));
            return parseCourse(s.id, { ...data, studentCount: countSnap.data().count });
        }));
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

// ── Guides ───────────────────────────────────────────────────────────────────
function parseGuide(id: string, d: Record<string, unknown>): GuideModel {
    return {
        ...d,
        id,
        uploadedAt: tsToDate(d.uploadedAt),
    } as GuideModel;
}

export const GuideService = {
    async getByCourse(courseId: string): Promise<GuideModel[]> {
        // Fetch all guides for this course without server-side ordering to avoid index requirement
        const snaps = await getDocs(
            query(collection(db, 'guides'), where('courseId', '==', courseId)),
        );
        
        // Map and then sort in-memory by 'order'
        return snaps.docs
            .map((s) => parseGuide(s.id, s.data() as Record<string, unknown>))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    },

    async create(guide: Omit<GuideModel, 'id'>): Promise<string> {
        const ref = doc(collection(db, 'guides'));
        await setDoc(ref, { 
            ...guide, 
            uploadedAt: serverTimestamp(),
            createdAt: serverTimestamp(), 
            updatedAt: serverTimestamp() 
        });
        return ref.id;
    },

    async update(id: string, data: Partial<GuideModel>): Promise<void> {
        await updateDoc(doc(db, 'guides', id), { ...data, updatedAt: serverTimestamp() });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'guides', id));
    },
};

// ── Notifications ────────────────────────────────────────────────────────────
export const NotificationService = {
    async create(notification: any): Promise<void> {
        const ref = doc(collection(db, 'notifications'));
        await setDoc(ref, {
            ...notification,
            createdAt: serverTimestamp(),
            isRead: false
        });
    },

    async getByUser(userId: string, limitN = 10): Promise<any[]> {
        const snaps = await getDocs(
            query(
                collection(db, 'notifications'), 
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitN)
            )
        );
        return snaps.docs.map(s => ({ id: s.id, ...s.data(), createdAt: tsToDate(s.data().createdAt) }));
    },

    async markAsRead(id: string): Promise<void> {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
    }
};

// ── Ranking & Analytics ──────────────────────────────────────────────────────
export const RankingService = {
    async getTopStudents(instructorId: string): Promise<any[]> {
        const courses = await CourseService.getByInstructor(instructorId);
        const allEnrollments = await Promise.all(
            courses.map(c => CourseService.getEnrollments(c.id))
        );
        const students = allEnrollments.flat();
        
        // Deduplicate and sort by avgScore
        const unique = Array.from(new Map(students.map(s => [s.studentId, s])).values());
        return unique
            .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
            .slice(0, 10);
    }
};

// ── Evaluations & Rubrics ────────────────────────────────────────────────────
export const EvaluationService = {
    async getRubrics(instructorId: string): Promise<any[]> {
        const snaps = await getDocs(
            query(collection(db, 'rubrics'), where('instructorId', '==', instructorId))
        );
        const rubrics = snaps.docs.map(s => ({ id: s.id, ...s.data() }));
        
        if (rubrics.length === 0) {
            // Seed default AHA rubrics if empty
            return [
                { id: 'bls-2025', title: 'Rúbrica BLS 2025', type: 'Lista de Chequeo', items: 15, color: '#1800AD' },
                { id: 'acls-exam', title: 'Teórico Adultos', type: 'Examen', items: 25, color: '#6366F1' }
            ];
        }
        return rubrics;
    }
};

export const SearchService = {
    async globalSearch(instructorId: string, searchTerm: string): Promise<any[]> {
        if (!searchTerm || searchTerm.length < 2) return [];
        const term = searchTerm.toLowerCase();

        // Fetch courses for instructor
        const courses = await CourseService.getByInstructor(instructorId);
        const filteredCourses = courses.filter(c => 
            c.title.toLowerCase().includes(term) || 
            (c.certification && c.certification.toLowerCase().includes(term))
        ).map(c => ({
            id: c.id,
            title: c.title,
            type: 'Curso',
            icon: 'BookOpen',
            href: `/instructor/courses/${c.id}`
        }));

        // Fetch students from those courses
        const enrollmentsPromises = courses.map(c => CourseService.getEnrollments(c.id));
        const allEnrollments = (await Promise.all(enrollmentsPromises)).flat();
        
        // Deduplicate students by ID
        const uniqueStudents = Array.from(new Map(allEnrollments.map(e => [e.studentId, e])).values());
        const filteredStudents = uniqueStudents.filter(s => 
            s.studentName.toLowerCase().includes(term) || 
            s.studentEmail.toLowerCase().includes(term)
        ).map(s => ({
            id: s.studentId,
            title: s.studentName,
            type: 'Estudiante',
            icon: 'User',
            href: `/instructor/students`
        }));

        return [...filteredCourses, ...filteredStudents].slice(0, 8);
    }
};

export const ActivityService = {
    async getRecentActivity(instructorId: string): Promise<any[]> {
        try {
            // Fetch real notifications first
            const notifications = await NotificationService.getByUser(instructorId, 10);
            
            // If no notifications, fallback to generating from sessions
            if (notifications.length === 0) {
                const courses = await CourseService.getByInstructor(instructorId);
                const sessionPromises = courses.map(c => SessionService.getByCourse(c.id));
                const allSessions = (await Promise.all(sessionPromises)).flat();
                
                return allSessions
                    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
                    .slice(0, 5)
                    .map(s => ({
                        id: s.id,
                        title: (s.metrics?.qualityScore || 0) >= 85 ? 'Certificación Exitosa' : 'Práctica Registrada',
                        desc: `${s.studentName} completó ${s.scenarioTitle} con ${s.metrics?.qualityScore || 0}% de calidad.`,
                        time: this.formatTimeAgo(s.startedAt),
                        type: (s.metrics?.qualityScore || 0) >= 85 ? 'success' : 'info',
                        icon: (s.metrics?.qualityScore || 0) >= 85 ? 'Award' : 'Activity'
                    }));
            }

            return notifications.map(n => ({
                id: n.id,
                title: n.title,
                desc: n.message || n.desc,
                time: this.formatTimeAgo(n.createdAt),
                type: n.type || 'info',
                icon: n.icon || 'Bell'
            }));
        } catch (error) {
            console.error('Error fetching activity:', error);
            return [];
        }
    },

    formatTimeAgo(date: Date): string {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return `Hace ${seconds} seg`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `Hace ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours} h`;
        return date.toLocaleDateString();
    }
};