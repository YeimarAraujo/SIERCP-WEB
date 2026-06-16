
import {
  collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CourseModel } from '@/shared/types/course';
import type { PlatformEnrollment } from '@/shared/types/enrollment';
import { getCursoBySlug } from '@/data/cursos';
import type { StudentCourseCard, CourseCardSource } from '@/shared/types/student-course-card';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tsToDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

function formatDateES(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Legacy course parser (same as firestore.service.ts) ─────────────────────

function parseLegacyCourse(id: string, d: Record<string, unknown>): CourseModel {
  return {
    ...d,
    id,
    minScore: (d.minScore as number) ?? (d.requiredScore as number) ?? 85,
    moduleCount: (d.moduleCount as number) ?? (d.totalModules as number) ?? 0,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    nextDeadline: d.nextDeadline ? tsToDate(d.nextDeadline) : undefined,
  } as CourseModel;
}

// ─── Core: Fetch legacy enrollments ──────────────────────────────────────────

async function fetchLegacyCourses(userId: string): Promise<StudentCourseCard[]> {
  // Get all active courses, then check enrollment sub-collection for this student
  const allCoursesSnap = await getDocs(
    query(collection(db, 'courses'), where('isActive', '==', true)),
  );

  const cards: StudentCourseCard[] = [];

  await Promise.all(
    allCoursesSnap.docs.map(async (courseSnap) => {
      try {
        const enrollSnap = await getDoc(
          doc(db, 'courses', courseSnap.id, 'enrollments', userId),
        );
        if (enrollSnap.exists()) {
          const course = parseLegacyCourse(courseSnap.id, courseSnap.data());
          cards.push(legacyCourseToCard(course));
        }
      } catch {
        // Silent — student may not have read access to all sub-collections
      }
    }),
  );

  return cards;
}

function legacyCourseToCard(course: CourseModel): StudentCourseCard {
  return {
    id: course.id,
    title: course.title,
    certification: course.certification || 'SIERCP',
    instructorName: course.instructorName || 'Instructor',
    studentCount: course.studentCount || 0,
    href: `/student/courses/${course.id}`,
    source: 'legacy' as CourseCardSource,
    isLocked: false,
    lockedReason: null,
    enrollmentId: null,
    cohortId: null,
    institutionId: null,
    courseSlug: null,
    status: 'active',
    enrolledAt: null,
    amountPaid: null,
    paymentMethod: null,
  };
}

// ─── Core: Fetch platform enrollments ────────────────────────────────────────

async function fetchPlatformEnrollments(userId: string): Promise<{
  cards: StudentCourseCard[];
  enrollments: PlatformEnrollment[];
}> {
  const q = query(
    collection(db, 'platform_enrollments'),
    where('userId', '==', userId),
    where('status', '==', 'active'),
    orderBy('enrolledAt', 'desc'),
  );

  const snaps = await getDocs(q);
  const allCohortIds = [...new Set(
    snaps.docs.map(d => d.data().cohortId).filter(Boolean) as string[]
  )];
  const cohortSnaps = await Promise.all(
    allCohortIds.map(id => getDoc(doc(db, 'cohorts', id)))
  );
  const cohortMap = new Map(cohortSnaps.filter(s => s.exists()).map(s => [s.id, s.data()]));

  const enrollments: PlatformEnrollment[] = [];
  const cards: StudentCourseCard[] = [];

  for (const dSnap of snaps.docs) {
    const raw = dSnap.data();
    const enrollment: PlatformEnrollment = {
      ...raw,
      id: dSnap.id,
      enrolledAt: tsToDate(raw.enrolledAt),
      completedAt: raw.completedAt ? tsToDate(raw.completedAt) : null,
    } as PlatformEnrollment;

    enrollments.push(enrollment);

    const cohortData = cohortMap.get(enrollment.cohortId);
    const lockState = (() => {
      if (!cohortData) return { isLocked: false, lockedReason: null };
      const classesStart = cohortData.classesStart ? tsToDate(cohortData.classesStart) : null;
      if (classesStart && classesStart > new Date()) {
        return { isLocked: true, lockedReason: `Inicia el ${formatDateES(classesStart)}` };
      }
      return { isLocked: false, lockedReason: null };
    })();

    cards.push({
      id: `platform-${dSnap.id}`,
      title: enrollment.courseTitle || 'Curso',
      certification: 'SIERCP / JOMAR',
      instructorName: enrollment.institutionId === 'jomar-seguridad'
        ? 'Jomar Seguridad'
        : enrollment.institutionId || 'Institución',
      studentCount: 0,
      href: `/student/courses/${enrollment.courseSlug}`,
      source: 'platform' as CourseCardSource,
      ...lockState,
      enrollmentId: dSnap.id,
      cohortId: enrollment.cohortId || null,
      institutionId: enrollment.institutionId || null,
      courseSlug: enrollment.courseSlug || null,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt instanceof Date
        ? enrollment.enrolledAt.toISOString()
        : new Date().toISOString(),
      amountPaid: enrollment.amountPaid ?? null,
      paymentMethod: enrollment.paymentMethod ?? null,
    });
  }

  return { cards, enrollments };
}

// ─── Business Logic: Cohort Lock ─────────────────────────────────────────────

async function computeLockState(cohortId: string | undefined | null): Promise<{
  isLocked: boolean;
  lockedReason: string | null;
}> {
  if (!cohortId) {
    return { isLocked: false, lockedReason: null };
  }

  try {
    const cohortSnap = await getDoc(doc(db, 'cohorts', cohortId));
    if (!cohortSnap.exists()) {
      return { isLocked: false, lockedReason: null };
    }

    const data = cohortSnap.data();
    const classesStart = data.classesStart ? tsToDate(data.classesStart) : null;

    if (classesStart && classesStart > new Date()) {
      return {
        isLocked: true,
        lockedReason: `Inicia el ${formatDateES(classesStart)}`,
      };
    }

    return { isLocked: false, lockedReason: null };
  } catch {
    // If we can't read the cohort (permissions, etc.), treat as unlocked
    return { isLocked: false, lockedReason: null };
  }
}

// ─── De-duplication ──────────────────────────────────────────────────────────

function deduplicateCards(cards: StudentCourseCard[]): StudentCourseCard[] {
  const seen = new Map<string, StudentCourseCard>();

  for (const card of cards) {
    // Normalize title for comparison
    const key = card.title.toLowerCase().replace(/\s+/g, '-');

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, card);
      continue;
    }

    // Platform cards take priority (they have richer metadata)
    if (card.source === 'platform' && existing.source === 'legacy') {
      seen.set(key, card);
    }
    // If both are platform, keep the newer one (first in array, already ordered)
  }

  return Array.from(seen.values());
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

export const StudentEnrollmentService = {
  /**
   * Returns a unified list of courses for the student dashboard.
   * Merges legacy courses and platform enrollments, de-duplicates,
   * and pre-computes lock state.
   */
  async getStudentCourses(userId: string): Promise<StudentCourseCard[]> {
    const [legacyCards, platformResult] = await Promise.all([
      fetchLegacyCourses(userId),
      fetchPlatformEnrollments(userId),
    ]);

    const allCards = [...legacyCards, ...platformResult.cards];
    return deduplicateCards(allCards);
  },

  /**
   * Returns the raw platform enrollments with lock state computed.
   * Used by the /student/enrollments page that only shows platform data.
   */
  async getPlatformEnrollmentsWithLockState(userId: string): Promise<StudentCourseCard[]> {
    const { cards } = await fetchPlatformEnrollments(userId);
    return cards;
  },

  /**
   * Returns ONLY legacy course cards (no platform data).
   * Useful for pages that explicitly need the old data model.
   */
  async getLegacyCourses(userId: string): Promise<StudentCourseCard[]> {
    return fetchLegacyCourses(userId);
  },

  /**
   * Universal fetch for course details page (/student/courses/[id]).
   * Resolves both legacy courses (by doc ID) and platform courses (by slug).
   */
  async getCourseDetails(courseIdOrSlug: string, userId: string): Promise<{
    course: CourseModel;
    modules: any[];
    progress: Set<string>;
    isLocked?: boolean;
    lockedReason?: string | null;
  } | null> {
    // 1. Check if it's a platform enrollment by slug
    const platformQuery = query(
      collection(db, 'platform_enrollments'),
      where('userId', '==', userId),
      where('courseSlug', '==', courseIdOrSlug),
      limit(1)
    );
    const pSnaps = await getDocs(platformQuery);

    if (!pSnaps.empty) {
      const enrollment = pSnaps.docs[0].data() as PlatformEnrollment;

      let tData: any = null;
      // Get the template to load the course details and modules
      if (enrollment.templateId) {
        const tSnap = await getDoc(doc(db, 'course_templates', enrollment.templateId));
        if (tSnap.exists()) {
          tData = tSnap.data();
        }
      }

      if (!tData) {
        // Fallback to local hardcoded catalog for Jomar courses without template
        const localCourse = getCursoBySlug(courseIdOrSlug);
        if (localCourse) {
          tData = {
            title: localCourse.nombre,
            description: localCourse.descripcionLarga || localCourse.descripcion,
            institutionId: 'jomar-seguridad',
            modules: localCourse.modulos.map((m, i) => ({
              title: m.nombre,
              topics: m.temas,
              duration: m.duracion,
              order: i
            }))
          };
        }
      }

      if (tData) {
        // Map to legacy CourseModel for the UI
        const mockCourse: CourseModel = {
          id: courseIdOrSlug,
          title: tData.title || enrollment.courseTitle,
          description: tData.description || '',
          institutionId: tData.institutionId || 'jomar-seguridad',
          instructorId: tData.institutionId || 'jomar-seguridad',
          instructorName: tData.institutionId === 'jomar-seguridad' ? 'Jomar Seguridad' : tData.institutionName || 'Institución',
          certification: 'SIERCP / JOMAR',
          minScore: 80,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          moduleCount: tData.modules?.length || 0,
          studentCount: 0,
          inviteCode: '',
          completedModules: 0,
          guideIds: [],
          requiredGuideCount: 0,
          scenarioMode: 'completo',
        };

        const mockModules = (tData.modules || []).map((m: any, i: number) => ({
          id: m.id || `plat-mod-${i}`,
          title: m.title || m.nombre,
          description: m.topics?.join(', ') || m.description || '',
          type: m.type || 'teoria', // Use DB type, fallback to teoria
          order: m.order ?? i,
          estimatedMinutes: parseInt(m.duration) || 0,
          isRequired: m.isRequired ?? true,
        }));

        const lockState = await computeLockState(enrollment.cohortId);

        // Return with empty progress (can be wired to platform progress later)
        return {
          course: mockCourse,
          modules: mockModules,
          progress: new Set(),
          isLocked: lockState.isLocked,
          lockedReason: lockState.lockedReason,
        };
      }
    }

    // 2. Fallback to legacy lookup
    const { CourseService } = await import('./firestore.service');
    const legacyCourse = await CourseService.get(courseIdOrSlug);
    if (legacyCourse) {
      const [modules, progress] = await Promise.all([
        CourseService.getModules(courseIdOrSlug),
        CourseService.getStudentProgress(courseIdOrSlug, userId),
      ]);
      return { course: legacyCourse, modules, progress };
    }

    return null;
  },
};
