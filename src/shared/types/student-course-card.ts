/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SIERCP — StudentCourseCard (Unified Presentation Type)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This is the SINGLE type that the student-facing UI receives from the
 * StudentEnrollmentService.  It is already "view-ready": the UI never needs
 * to parse dates, check cohort statuses, or match across collections.
 *
 * Sources that feed into this type:
 *   1. Legacy `courses/{id}/enrollments/{studentId}` sub-collection.
 *   2. New `platform_enrollments` top-level collection (Jomar / multi-tenant).
 */

// ─── Origin discriminator ────────────────────────────────────────────────────

export type CourseCardSource = 'legacy' | 'platform';

// ─── Lock state (computed server-side) ───────────────────────────────────────

export interface LockState {
  /** true when the cohort hasn't started yet */
  isLocked: boolean;
  /** Human-readable reason, e.g. "Inicia el 25 jun 2026" */
  lockedReason: string | null;
}

// ─── Main presentation type ─────────────────────────────────────────────────

export interface StudentCourseCard extends LockState {
  /** Unique key for React — legacy course ID or platform enrollment ID */
  id: string;

  /** Display title */
  title: string;

  /** Certification label, e.g. "AHA / BLS" or "SIERCP / JOMAR" */
  certification: string;

  /** Instructor or institution name */
  instructorName: string;

  /** Number of students (legacy) or 0 (platform, not applicable) */
  studentCount: number;

  /** Link target — used by the courses page */
  href: string;

  /** Which data source this card came from */
  source: CourseCardSource;

  // ─── Platform-only metadata (null for legacy) ──────────────────────────────

  /** Platform enrollment ID */
  enrollmentId: string | null;

  /** Cohort ID (if platform) */
  cohortId: string | null;

  /** Institution ID (e.g. 'jomar-seguridad') */
  institutionId: string | null;

  /** Course slug for deep-linking */
  courseSlug: string | null;

  /** Enrollment status */
  status: 'active' | 'completed' | 'cancelled' | 'refunded';

  /** Enrolled-at date (ISO string for serialization safety) */
  enrolledAt: string | null;

  /** Amount paid (COP) */
  amountPaid: number | null;

  /** Payment method */
  paymentMethod: string | null;
}
