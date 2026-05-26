import { Timestamp } from 'firebase/firestore';

// ─── Schedule for automated cohort generation ────────────────────────────────

export interface ScheduleSlot {
  label: string;        // "7:00 AM - 11:00 AM"
  startTime: string;    // "07:00"
  endTime: string;      // "11:00"
}

// ─── Automation config (only for isAutomated=true templates) ─────────────────

export interface AutoConfig {
  maxStudentsPerGroup: number;      // e.g. 40
  enrollmentWindowDays: number;     // e.g. 21
  gapBetweenCyclesDays: number;     // e.g. 15
  schedules: ScheduleSlot[];
  autoRenew: boolean;               // Keep generating new cohorts indefinitely
}

// ─── Module within a course template ─────────────────────────────────────────

export interface TemplateModule {
  title: string;
  topics: string[];
  duration: string;
  order: number;
}

// ─── Course Template ─────────────────────────────────────────────────────────

export type CourseLevel = 'basico' | 'intermedio' | 'avanzado';
export type CourseModality = 'presencial' | 'virtual' | 'hibrida';

export interface CourseTemplate {
  id: string;
  institutionId: string;
  slug: string;
  title: string;
  description: string;
  descriptionLong: string;
  level: CourseLevel;
  modality: CourseModality;
  duration: string;
  sessions: number;
  priceCOP: number;
  priceUSD: number;
  objectives: string[];
  requirements: string[];
  includesCertificate: boolean;
  regulations: string[];
  tags: string[];
  icon: string;
  targetAudience: string;

  // ─── Automation ────────────────────────────────────────────────────────────
  isAutomated: boolean;
  autoConfig?: AutoConfig;

  // ─── Academic content ──────────────────────────────────────────────────────
  modules: TemplateModule[];

  // ─── Status ────────────────────────────────────────────────────────────────
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
}
