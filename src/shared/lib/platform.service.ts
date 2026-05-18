import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CourseTemplate } from '@/shared/types/course-template';
import type { Cohort, CohortStatus } from '@/shared/types/cohort';
import type { PlatformEnrollment } from '@/shared/types/enrollment';
import type { FinancialTransaction } from '@/shared/types/transaction';

// ─── Timestamp converter ─────────────────────────────────────────────────────

function tsToDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

// ─── Parse helpers ───────────────────────────────────────────────────────────

function parseTemplate(id: string, d: Record<string, any>): CourseTemplate {
  return {
    ...d,
    id,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  } as CourseTemplate;
}

function parseCohort(id: string, d: Record<string, any>): Cohort {
  return {
    ...d,
    id,
    enrollmentStart: tsToDate(d.enrollmentStart),
    enrollmentEnd: tsToDate(d.enrollmentEnd),
    classesStart: tsToDate(d.classesStart),
    classesEnd: d.classesEnd ? tsToDate(d.classesEnd) : undefined,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    closedAt: d.closedAt ? tsToDate(d.closedAt) : null,
  } as Cohort;
}

function parseEnrollment(id: string, d: Record<string, any>): PlatformEnrollment {
  return {
    ...d,
    id,
    enrolledAt: tsToDate(d.enrolledAt),
    completedAt: d.completedAt ? tsToDate(d.completedAt) : null,
  } as PlatformEnrollment;
}

function parseTransaction(id: string, d: Record<string, any>): FinancialTransaction {
  return {
    ...d,
    id,
    createdAt: tsToDate(d.createdAt),
    webhookReceivedAt: d.webhookReceivedAt ? tsToDate(d.webhookReceivedAt) : null,
  } as FinancialTransaction;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE TEMPLATE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const CourseTemplateService = {

  /** Get a single template by ID */
  async get(id: string): Promise<CourseTemplate | null> {
    const snap = await getDoc(doc(db, 'course_templates', id));
    if (!snap.exists()) return null;
    return parseTemplate(snap.id, snap.data());
  },

  /** Get a template by its slug within an institution */
  async getBySlug(institutionId: string, slug: string): Promise<CourseTemplate | null> {
    const snaps = await getDocs(
      query(
        collection(db, 'course_templates'),
        where('institutionId', '==', institutionId),
        where('slug', '==', slug),
        limit(1),
      ),
    );
    if (snaps.empty) return null;
    const s = snaps.docs[0];
    return parseTemplate(s.id, s.data());
  },

  /** List all active templates for an institution */
  async getByInstitution(institutionId: string): Promise<CourseTemplate[]> {
    const snaps = await getDocs(
      query(
        collection(db, 'course_templates'),
        where('institutionId', '==', institutionId),
        where('isActive', '==', true),
      ),
    );
    return snaps.docs.map(s => parseTemplate(s.id, s.data()));
  },

  /** List ALL active templates (public catalog) */
  async getAll(): Promise<CourseTemplate[]> {
    const snaps = await getDocs(
      query(collection(db, 'course_templates'), where('isActive', '==', true)),
    );
    return snaps.docs.map(s => parseTemplate(s.id, s.data()));
  },

  /** Create a new course template */
  async create(template: Omit<CourseTemplate, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'course_templates'));
    await setDoc(ref, {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Update a course template */
  async update(id: string, data: Partial<CourseTemplate>): Promise<void> {
    await updateDoc(doc(db, 'course_templates', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** Soft-delete (deactivate) a template */
  async deactivate(id: string): Promise<void> {
    await updateDoc(doc(db, 'course_templates', id), {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  /** Hard-delete a template */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'course_templates', id));
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COHORT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const CohortService = {

  /** Get a single cohort by ID */
  async get(id: string): Promise<Cohort | null> {
    const snap = await getDoc(doc(db, 'cohorts', id));
    if (!snap.exists()) return null;
    return parseCohort(snap.id, snap.data());
  },

  /** List cohorts for a template with optional status filter */
  async getByTemplate(templateId: string, statuses?: CohortStatus[]): Promise<Cohort[]> {
    let q;
    if (statuses && statuses.length > 0) {
      q = query(
        collection(db, 'cohorts'),
        where('templateId', '==', templateId),
        where('status', 'in', statuses),
        orderBy('cohortNumber', 'desc'),
      );
    } else {
      q = query(
        collection(db, 'cohorts'),
        where('templateId', '==', templateId),
        orderBy('cohortNumber', 'desc'),
      );
    }
    const snaps = await getDocs(q);
    return snaps.docs.map(s => parseCohort(s.id, s.data()));
  },

  /** List all enrollable cohorts for an institution (public catalog) */
  async getOpenByInstitution(institutionId: string): Promise<Cohort[]> {
    const snaps = await getDocs(
      query(
        collection(db, 'cohorts'),
        where('institutionId', '==', institutionId),
        where('status', 'in', ['OPEN', 'UPCOMING']),
        orderBy('enrollmentStart', 'asc'),
      ),
    );
    return snaps.docs.map(s => parseCohort(s.id, s.data()));
  },

  /** Get all open cohorts for a specific course slug */
  async getOpenBySlug(institutionId: string, courseSlug: string): Promise<Cohort[]> {
    const snaps = await getDocs(
      query(
        collection(db, 'cohorts'),
        where('institutionId', '==', institutionId),
        where('courseSlug', '==', courseSlug),
        where('status', 'in', ['OPEN', 'UPCOMING']),
        orderBy('enrollmentStart', 'asc'),
      ),
    );
    return snaps.docs.map(s => parseCohort(s.id, s.data()));
  },

  /** Create a new cohort */
  async create(cohort: Omit<Cohort, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'cohorts'));
    await setDoc(ref, {
      ...cohort,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Update cohort fields */
  async update(id: string, data: Partial<Cohort>): Promise<void> {
    await updateDoc(doc(db, 'cohorts', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Atomically increment the enrolled count.
   * Returns the new count. Uses Firestore FieldValue.increment for race-condition safety.
   */
  async incrementEnrolled(id: string): Promise<number> {
    const ref = doc(db, 'cohorts', id);
    await updateDoc(ref, {
      enrolledCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    // Read back the updated count
    const snap = await getDoc(ref);
    return snap.data()?.enrolledCount ?? 0;
  },

  /** Close a cohort (set status and timestamp) */
  async close(id: string, newStatus: CohortStatus = 'CLOSED'): Promise<void> {
    await updateDoc(doc(db, 'cohorts', id), {
      status: newStatus,
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /** Get all expired-but-still-open cohorts (for cron processing) */
  async getExpiredOpen(): Promise<Cohort[]> {
    const now = Timestamp.now();
    const snaps = await getDocs(
      query(
        collection(db, 'cohorts'),
        where('status', '==', 'OPEN'),
        where('enrollmentEnd', '<=', now),
      ),
    );
    return snaps.docs.map(s => parseCohort(s.id, s.data()));
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM ENROLLMENT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const PlatformEnrollmentService = {

  /** Get a single enrollment */
  async get(id: string): Promise<PlatformEnrollment | null> {
    const snap = await getDoc(doc(db, 'platform_enrollments', id));
    if (!snap.exists()) return null;
    return parseEnrollment(snap.id, snap.data());
  },

  /** Get all enrollments for a user (for "Mis Cursos") */
  async getByUser(userId: string): Promise<PlatformEnrollment[]> {
    const snaps = await getDocs(
      query(
        collection(db, 'platform_enrollments'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('enrolledAt', 'desc'),
      ),
    );
    return snaps.docs.map(s => parseEnrollment(s.id, s.data()));
  },

  /** Get all enrollments for a specific cohort */
  async getByCohort(cohortId: string): Promise<PlatformEnrollment[]> {
    const snaps = await getDocs(
      query(
        collection(db, 'platform_enrollments'),
        where('cohortId', '==', cohortId),
        orderBy('enrolledAt', 'desc'),
      ),
    );
    return snaps.docs.map(s => parseEnrollment(s.id, s.data()));
  },

  /** Get all enrollments for an institution */
  async getByInstitution(institutionId: string): Promise<PlatformEnrollment[]> {
    const snaps = await getDocs(
      query(
        collection(db, 'platform_enrollments'),
        where('institutionId', '==', institutionId),
        orderBy('enrolledAt', 'desc'),
      ),
    );
    return snaps.docs.map(s => parseEnrollment(s.id, s.data()));
  },

  /** Check if a user is already enrolled in a specific cohort */
  async isEnrolled(userId: string, cohortId: string): Promise<boolean> {
    const snaps = await getDocs(
      query(
        collection(db, 'platform_enrollments'),
        where('userId', '==', userId),
        where('cohortId', '==', cohortId),
        where('status', '==', 'active'),
        limit(1),
      ),
    );
    return !snaps.empty;
  },

  /** Create a new enrollment */
  async create(enrollment: Omit<PlatformEnrollment, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'platform_enrollments'));
    await setDoc(ref, {
      ...enrollment,
      enrolledAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Update enrollment status */
  async updateStatus(id: string, status: PlatformEnrollment['status']): Promise<void> {
    await updateDoc(doc(db, 'platform_enrollments', id), {
      status,
      ...(status === 'completed' ? { completedAt: serverTimestamp() } : {}),
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIAL TRANSACTION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const TransactionService = {

  /** Get a transaction by ID */
  async get(id: string): Promise<FinancialTransaction | null> {
    const snap = await getDoc(doc(db, 'transactions', id));
    if (!snap.exists()) return null;
    return parseTransaction(snap.id, snap.data());
  },

  /** Get transaction by Wompi reference */
  async getByReference(reference: string): Promise<FinancialTransaction | null> {
    const snaps = await getDocs(
      query(
        collection(db, 'transactions'),
        where('reference', '==', reference),
        limit(1),
      ),
    );
    if (snaps.empty) return null;
    const s = snaps.docs[0];
    return parseTransaction(s.id, s.data());
  },

  /** Create a new transaction */
  async create(tx: Omit<FinancialTransaction, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'transactions'));
    await setDoc(ref, {
      ...tx,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Update transaction status (typically from webhook) */
  async updateStatus(id: string, status: FinancialTransaction['status'], wompiStatus: string): Promise<void> {
    await updateDoc(doc(db, 'transactions', id), {
      status,
      wompiStatus,
      webhookReceivedAt: serverTimestamp(),
    });
  },

  /** Get transactions for an institution (reporting) */
  async getByInstitution(institutionId: string, limitN = 50): Promise<FinancialTransaction[]> {
    const snaps = await getDocs(
      query(
        collection(db, 'transactions'),
        where('institutionId', '==', institutionId),
        orderBy('createdAt', 'desc'),
        limit(limitN),
      ),
    );
    return snaps.docs.map(s => parseTransaction(s.id, s.data()));
  },
};
