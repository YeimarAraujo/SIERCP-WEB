import { Timestamp } from 'firebase/firestore';

// ─── Enrollment Status ───────────────────────────────────────────────────────

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'refunded';
export type PaymentMethodType = 'CARD' | 'PSE' | 'TRANSFER' | 'FREE';

// ─── Platform Enrollment (top-level collection) ─────────────────────────────

export interface PlatformEnrollment {
  id: string;
  userId: string;
  email: string;
  studentName: string;
  institutionId: string;
  templateId: string;
  cohortId: string;

  // Denormalized
  courseSlug: string;
  courseTitle: string;

  // ─── Payment ───────────────────────────────────────────────────────────────
  paymentId: string | null;
  paymentMethod: PaymentMethodType;
  amountPaid: number;

  // ─── Status ────────────────────────────────────────────────────────────────
  status: EnrollmentStatus;
  enrolledAt: Date | Timestamp;
  completedAt?: Date | Timestamp | null;
  certificateId?: string | null;
}
