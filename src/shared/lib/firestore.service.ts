import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, serverTimestamp, Timestamp, increment,
    type QueryConstraint, collectionGroup, getCountFromServer
} from 'firebase/firestore';
import { auth, db, getSecondaryAuth } from './firebase';
import type { UserModel, CreateUserDTO, } from '@/shared/types/user';
import type { SessionModel } from '@/shared/types/session';
import type { CourseModel, Enrollment } from '@/shared/types/course';
import type { ManiquiModel } from '@/shared/types/device';
import type { GuideModel } from '@/shared/types/guide';
import { AuditService } from '@/features/audit/services/audit.service';
import {
    createUserWithEmailAndPassword, signOut
} from 'firebase/auth';
import {
    arrayUnion,
} from 'firebase/firestore';

function tsToDate(val: unknown): Date {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    return new Date();
}
function buildUserModel(
    uid: string,
    data: CreateUserDTO
): UserModel {
    return {
        uid,

        email: data.email,

        firstName: data.firstName,
        lastName: data.lastName,
        identification: data.identification,
        phoneNumber: data.phoneNumber,
        role: data.role,

        institutionId: data.institutionId,

        isActive: true,

        status: 'ACTIVE',

        certVerification: 'NONE',

        coursesCreated: 0,

        courses: [],

        stats: {
            totalSessions: 0,
            sessionsToday: 0,
            averageScore: 0,
            bestScore: 0,
            streakDays: 0,
            totalHours: 0,
            averageDepthMm: 0,
            averageRatePerMin: 0,
        },

        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

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
    async create(data: CreateUserDTO): Promise<UserModel> {
        const secondaryAuth = getSecondaryAuth();
        if (!secondaryAuth) throw new Error('Auth no disponible');

        const cred = await createUserWithEmailAndPassword(
            secondaryAuth,
            data.email,
            data.password
        );
        await signOut(secondaryAuth);

        const userData = buildUserModel(
            cred.user.uid,
            data
        );

        await setDoc(
            doc(db, 'users', userData.uid),
            {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }
        );

        await AuditService.record({
            action: 'create',
            resource: 'user',
            resourceId: userData.uid,
            institutionId: data.institutionId,
            metadata: {
                role: data.role,
                email: data.email,
            },
        });

        return userData;
    },
    async update(uid: string, data: Partial<UserModel>): Promise<void> {
        await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
        await AuditService.record({
            action: data.role ? 'role.change' : 'update',
            resource: 'user',
            resourceId: uid,
            institutionId: data.institutionId,
            metadata: { fields: Object.keys(data) },
        });
    },

    async delete(uid: string): Promise<void> {
        await deleteDoc(doc(db, 'users', uid));
        await AuditService.record({ action: 'delete', resource: 'user', resourceId: uid, severity: 'warning' });
    },
};

function parseSession(id: string, d: Record<string, any>): SessionModel {
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

    async getCountByStudent(studentId: string): Promise<number> {
        try {
            const countSnap = await getCountFromServer(
                query(collection(db, 'sessions'), where('studentId', '==', studentId))
            );
            return countSnap.data().count;
        } catch (e) {
            return 0;
        }
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
        await AuditService.record({
            action: 'create',
            resource: 'session',
            resourceId: ref.id,
            metadata: { studentId: session.studentId, courseId: session.courseId, status: session.status },
        });
        return ref.id;
    },

    async update(id: string, data: Partial<SessionModel>): Promise<void> {
        await updateDoc(doc(db, 'sessions', id), { ...data, updatedAt: serverTimestamp() });
        await AuditService.record({
            action: 'update',
            resource: 'session',
            resourceId: id,
            metadata: { fields: Object.keys(data), status: data.status },
        });
    },

    async getAllRecent(limitN = 20): Promise<SessionModel[]> {
        const snaps = await getDocs(
            query(collection(db, 'sessions'), orderBy('startedAt', 'desc'), limit(limitN))
        );
        return snaps.docs.map((s) => parseSession(s.id, s.data() as Record<string, unknown>));
    },
};

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
    async get(id: string, includeCount = false): Promise<CourseModel | null> {
        const snap = await getDoc(doc(db, 'courses', id));
        if (!snap.exists()) return null;
        const data = snap.data() as Record<string, unknown>;
        let studentCount = data.studentCount || 0;
        if (includeCount) {
            try {
                const countSnap = await getCountFromServer(collection(db, 'courses', id, 'enrollments'));
                studentCount = countSnap.data().count;
            } catch (e) {
                // Ignore
            }
        }
        return parseCourse(snap.id, { ...data, studentCount });
    },

    async getByInstructor(instructorId: string, includeCount = false): Promise<CourseModel[]> {
        // Query 1: instructorId singular (instructor primario)
        const [snap1, snap2] = await Promise.all([
            getDocs(query(collection(db, 'courses'), where('instructorId', '==', instructorId))),
            // Query 2: instructorIds array (instructor asignado por admin)
            getDocs(query(collection(db, 'courses'), where('instructorIds', 'array-contains', instructorId))),
        ]);

        // Deduplicar por ID de documento
        const seen = new Set<string>();
        const uniqueDocs = [...snap1.docs, ...snap2.docs].filter(d => {
            if (seen.has(d.id)) return false;
            seen.add(d.id);
            return true;
        });

        // Conteo real desde la subcolección enrollments (el contador denormalizado
        // se desfasa porque las inscripciones por QR en Flutter no lo incrementan).
        // Solo cuando se pide explícitamente, con fallback al valor guardado si la
        // aggregation query falla (p.ej. 403 puntual).
        return Promise.all(uniqueDocs.map(async (s) => {
            const data = s.data() as Record<string, unknown>;
            let studentCount = (data.studentCount as number) || 0;
            if (includeCount) {
                try {
                    const countSnap = await getCountFromServer(collection(db, 'courses', s.id, 'enrollments'));
                    studentCount = countSnap.data().count;
                } catch (e) { /* fallback al valor guardado */ }
            }
            return parseCourse(s.id, { ...data, studentCount });
        }));
    },

    async getByStudent(studentId: string): Promise<CourseModel[]> {
        // En lugar de usar collectionGroup (que requiere índices y reglas globales desplegadas),
        // iteramos sobre los cursos y verificamos la inscripción del estudiante directamente.
        // Esto es 100% compatible con las reglas locales actuales.
        const allCourses = await this.getAll(false);
        const enrolledCourses: CourseModel[] = [];

        await Promise.all(allCourses.map(async (course) => {
            try {
                const snap = await getDoc(doc(db, 'courses', course.id, 'enrollments', studentId));
                if (snap.exists()) {
                    enrolledCourses.push(course);
                }
            } catch (e) {
                // Ignore errors
            }
        }));

        return enrolledCourses;
    },

    async getAll(includeCount = false): Promise<CourseModel[]> {
        const snaps = await getDocs(query(collection(db, 'courses'), where('isActive', '==', true)));
        return Promise.all(snaps.docs.map(async (s) => {
            const data = s.data() as Record<string, unknown>;
            let studentCount = data.studentCount || 0;
            if (includeCount) {
                try {
                    const countSnap = await getCountFromServer(collection(db, 'courses', s.id, 'enrollments'));
                    studentCount = countSnap.data().count;
                } catch (e) { }
            }
            return parseCourse(s.id, { ...data, studentCount });
        }));
    },
    async create(course: Omit<CourseModel, 'id'>): Promise<string> {

        const ref = doc(collection(db, 'courses'));

        // ── Instructor final ─────────────────────────────
        const instructorId =
            course.instructorId || course.createdBy;

        if (!instructorId) {
            throw new Error('El curso debe tener un creador');
        }

        // ── Obtener instructor ───────────────────────────
        const instructorRef = doc(db, 'users', instructorId);

        const instructorSnap = await getDoc(instructorRef);

        if (!instructorSnap.exists()) {
            throw new Error('Instructor no encontrado');
        }

        const instructor = instructorSnap.data();

        // ── Datos finales del curso ──────────────────────
        const courseData = {
            ...course,

            instructorId,

            instructorName:
                course.instructorName ||
                `${instructor.firstName} ${instructor.lastName}`,

            instructorEmail:
                course.instructorEmail ||
                instructor.email,

            createdBy:
                course.createdBy || instructorId,

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // ── Crear curso ──────────────────────────────────
        await setDoc(ref, courseData);

        // ── Actualizar instructor ────────────────────────
        await updateDoc(instructorRef, {

            coursesCreated: increment(1),

            courses: arrayUnion(ref.id),

            memberships: arrayUnion(
                course.institutionId
            ),

            updatedAt: serverTimestamp(),
        });

        // ── Audit ────────────────────────────────────────
        await AuditService.record({
            action: 'create',
            resource: 'course',
            resourceId: ref.id,
            institutionId: course.institutionId,
            metadata: {
                title: course.title,
                instructorId,
            },
        });

        return ref.id;
    },

    async update(id: string, data: Partial<CourseModel>): Promise<void> {
        await updateDoc(doc(db, 'courses', id), { ...data, updatedAt: serverTimestamp() });
        await AuditService.record({
            action: 'update',
            resource: 'course',
            resourceId: id,
            metadata: { fields: Object.keys(data), title: data.title },
        });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'courses', id));
        await AuditService.record({ action: 'delete', resource: 'course', resourceId: id, severity: 'warning' });
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
            studentCount: increment(1),
            updatedAt: serverTimestamp(),
        });
        await AuditService.record({
            action: 'create',
            resource: 'enrollment',
            resourceId: `${courseId}:${enrollment.studentId}`,
            metadata: { courseId, studentId: enrollment.studentId, status: enrollment.status },
        });
    },

    async getEnrollments(courseId: string): Promise<Enrollment[]> {
        const snaps = await getDocs(collection(db, 'courses', courseId, 'enrollments'));
        return snaps.docs.map((s) => {
            const d = s.data();
            return { ...d, enrolledAt: tsToDate(d.enrolledAt) } as Enrollment;
        });
    },

    async getModules(courseId: string): Promise<any[]> {
        if (!db) return [];
        const snaps = await getDocs(
            query(collection(db, 'courses', courseId, 'modules'), orderBy('order', 'asc'))
        );
        return snaps.docs.map((s) => ({ id: s.id, ...s.data() }));
    },

    async getStudentProgress(courseId: string, studentId: string): Promise<Set<string>> {
        if (!db) return new Set();
        try {
            const snap = await getDoc(doc(db, 'courses', courseId, 'progress', studentId));
            if (!snap.exists()) return new Set();
            const data = snap.data();
            return new Set(data?.completedModules || []);
        } catch (e) {
            // Reglas de progreso pendientes de despliegue, retorna set vacío para no romper la app
            return new Set();
        }
    },

    async markModuleComplete(courseId: string, studentId: string, moduleId: string): Promise<void> {
        if (!db) return;
        const progressRef = doc(db, 'courses', courseId, 'progress', studentId);
        const snap = await getDoc(progressRef);
        const existing = snap.exists() ? snap.data()?.completedModules || [] : [];
        await setDoc(progressRef, {
            completedModules: [...existing, moduleId],
            lastAccessedAt: serverTimestamp(),
        }, { merge: true });
    },
};

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
        await AuditService.record({ action: 'update', resource: 'manikin', resourceId: id, metadata: { fields: Object.keys(data) } });
    },
};

function parseGuide(id: string, d: Record<string, unknown>): GuideModel {
    return {
        ...d,
        id,
        uploadedAt: tsToDate(d.uploadedAt),
    } as GuideModel;
}

export const GuideService = {
    async getByCourse(courseId: string): Promise<GuideModel[]> {
        const snaps = await getDocs(
            query(collection(db, 'guides'), where('courseId', '==', courseId)),
        );
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
        await AuditService.record({
            action: 'create',
            resource: 'guide',
            resourceId: ref.id,
            metadata: { title: guide.title, courseId: guide.courseId },
        });
        return ref.id;
    },

    async update(id: string, data: Partial<GuideModel>): Promise<void> {
        await updateDoc(doc(db, 'guides', id), { ...data, updatedAt: serverTimestamp() });
        await AuditService.record({ action: 'update', resource: 'guide', resourceId: id, metadata: { fields: Object.keys(data) } });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'guides', id));
        await AuditService.record({ action: 'delete', resource: 'guide', resourceId: id, severity: 'warning' });
    },
};

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
        // Consultamos solo por userId (índice de campo único, siempre disponible) y
        // ordenamos en memoria. Evita requerir un índice compuesto userId+createdAt
        // cuya ausencia hacía fallar la consulta → notificaciones vacías.
        const snaps = await getDocs(
            query(collection(db, 'notifications'), where('userId', '==', userId))
        );
        return snaps.docs
            .map(s => ({ id: s.id, ...s.data(), createdAt: tsToDate(s.data().createdAt) }))
            .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limitN);
    },

    async markAsRead(id: string): Promise<void> {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
    },

    /**
     * Anuncios masivos (colección `broadcasts`) que aplican a este usuario.
     * El filtrado por audiencia es en cliente (igual que la app Flutter):
     *   · all          → todos
     *   · role         → coincide el rol del usuario
     *   · institution  → coincide la institución del usuario
     * Las reglas (§42) permiten lectura a cualquier autenticado.
     */
    async getBroadcastsForUser(
        role?: string,
        institutionId?: string,
        limitN = 15,
    ): Promise<any[]> {
        const snaps = await getDocs(collection(db, 'broadcasts'));
        return snaps.docs
            .map(s => ({ id: s.id, ...s.data(), createdAt: tsToDate(s.data().createdAt) }))
            .filter((b: any) =>
                b.audience === 'all' ||
                (b.audience === 'role' && b.role === role) ||
                (b.audience === 'institution' && b.institutionId === institutionId)
            )
            .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limitN);
    }
};

export const RankingService = {
    async getTopStudents(instructorId: string): Promise<any[]> {
        const courses = await CourseService.getByInstructor(instructorId);
        const allEnrollments = await Promise.all(
            courses.map(c => CourseService.getEnrollments(c.id))
        );
        const students = allEnrollments.flat();
        const unique = Array.from(new Map(students.map(s => [s.studentId, s])).values());
        return unique
            .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
            .slice(0, 10);
    }
};

export const EvaluationService = {
    async getRubrics(instructorId: string): Promise<any[]> {
        const snaps = await getDocs(
            query(collection(db, 'rubrics'), where('instructorId', '==', instructorId))
        );
        const rubrics = snaps.docs.map(s => ({ id: s.id, ...s.data() }));
        if (rubrics.length === 0) {
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
        const enrollmentsPromises = courses.map(c => CourseService.getEnrollments(c.id));
        const allEnrollments = (await Promise.all(enrollmentsPromises)).flat();
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
    async getRecentActivity(
        userId: string,
        opts?: { role?: string; institutionId?: string },
    ): Promise<any[]> {
        try {
            // Personales (dirigidas por userId) + anuncios masivos (broadcasts).
            // Se fusionan y ordenan por fecha, igual que la app Flutter.
            const [personal, broadcasts] = await Promise.all([
                NotificationService.getByUser(userId, 10),
                NotificationService.getBroadcastsForUser(opts?.role, opts?.institutionId, 15),
            ]);
            const merged = [...personal, ...broadcasts];

            if (merged.length === 0) {
                // Fallback (caso instructor): actividad derivada de sesiones de sus cursos.
                const courses = await CourseService.getByInstructor(userId);
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

            return merged
                .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 12)
                .map((n: any) => ({
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

export const FirestoreService = {
    create: SessionService.create,
    get: SessionService.get,
    update: SessionService.update,
};
