import { Timestamp } from 'firebase/firestore';

/**
 * Defines the resource limits and feature flags for each institution plan.
 * Used for quota enforcement across the platform.
 */
export interface PlanLimits {
  // ─── Users ──────────────────────────────────────────────────────────────
  /** Maximum active students across all cohorts */
  maxStudents: number;
  /** Maximum instructors that can be assigned */
  maxInstructors: number;
  /** Maximum admin users for the institution */
  maxAdmins: number;
  /** Maximum concurrent users in live sessions */
  maxConcurrentUsers: number;

  // ─── Content ────────────────────────────────────────────────────────────
  /** Maximum number of course templates */
  maxCourses: number;
  /** Maximum simultaneously active cohorts */
  maxActiveCohorts: number;
  /** Maximum modules per course */
  maxModulesPerCourse: number;
  /** Storage limit in MB for uploaded resources (PDFs, images, videos) */
  storageLimitMB: number;
  /** Maximum file size per upload in MB */
  maxFileSizeMB: number;

  // ─── Hardware (SIERCP IoT) ──────────────────────────────────────────────
  /** Maximum connected SIERCP manikin devices */
  maxDevices: number;
  /** Session history retention in days (-1 = unlimited) */
  sessionRetentionDays: number;
  /** Access to advanced metrics (depth, rate, recoil per compression) */
  hasAdvancedMetrics: boolean;

  // ─── Automation ─────────────────────────────────────────────────────────
  /** Allows automated cohort lifecycle (auto-open, auto-close) */
  hasAutomatedCohorts: boolean;
  /** Automatic PDF certificate generation */
  hasAutoCertificates: boolean;
  /** Custom certificate templates (logo, colors, layout) */
  hasCustomCertificates: boolean;
  /** Automated email/SMS reminders for classes and payments */
  hasAutoReminders: boolean;

  // ─── Monetization ───────────────────────────────────────────────────────
  /** Platform transaction fee as percentage (e.g. 5.0 = 5%) */
  transactionFeePercent: number;
  /** Allow institution to connect their own Wompi/Stripe keys */
  hasOwnPaymentGateway: boolean;
  /** Ability to create discount codes */
  hasDiscountCodes: boolean;

  // ─── Branding / White-label ─────────────────────────────────────────────
  /** Remove "Powered by SIERCP" from footers, emails, certificates */
  hasWhiteLabel: boolean;
  /** Custom color theme (primary color, accent) */
  hasCustomTheme: boolean;
  /** Custom domain (e.g. cursos.institucion.com) */
  hasCustomDomain: boolean;
  /** Send emails from institution's own domain */
  hasCustomEmailDomain: boolean;

  // ─── Integrations ───────────────────────────────────────────────────────
  /** Zoom / Meet / Teams integration for live sessions */
  hasVideoIntegration: boolean;
  /** REST API & webhook access for external systems */
  hasAPIAccess: boolean;
  /** Export data to Excel/CSV/PDF */
  hasDataExport: boolean;

  // ─── Support ────────────────────────────────────────────────────────────
  /** Support level: 'community' | 'email' | 'priority' | 'dedicated' */
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  /** Guaranteed response time in hours (-1 = no SLA) */
  slaResponseHours: number;
}

/**
 * Represents a subscription plan that can be assigned to institutions.
 */
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Monthly price in COP (-1 = custom pricing / contact sales) */
  priceCOP: number;
  /** Annual price in COP (discount over monthly) */
  annualPriceCOP: number;
  /** Display order (lower = first) */
  displayOrder: number;
  /** Whether this plan is publicly visible in the pricing page */
  isPublic: boolean;
  /** Whether this is the recommended/highlighted plan */
  isRecommended: boolean;
  /** The feature limits for this plan */
  limits: PlanLimits;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Default plan configurations ──────────────────────────────────────────────

/** -1 means unlimited */
const UNLIMITED = -1;

export const DEFAULT_PLANS: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Para instituciones pequeñas que inician su digitalización',
    priceCOP: 0,
    annualPriceCOP: 0,
    displayOrder: 1,
    isPublic: true,
    isRecommended: false,
    limits: {
      maxStudents: 50,
      maxInstructors: 3,
      maxAdmins: 1,
      maxConcurrentUsers: 10,
      maxCourses: 3,
      maxActiveCohorts: 3,
      maxModulesPerCourse: 5,
      storageLimitMB: 500,
      maxFileSizeMB: 25,
      maxDevices: 2,
      sessionRetentionDays: 30,
      hasAdvancedMetrics: false,
      hasAutomatedCohorts: false,
      hasAutoCertificates: false,
      hasCustomCertificates: false,
      hasAutoReminders: false,
      transactionFeePercent: 8.0,
      hasOwnPaymentGateway: false,
      hasDiscountCodes: false,
      hasWhiteLabel: false,
      hasCustomTheme: false,
      hasCustomDomain: false,
      hasCustomEmailDomain: false,
      hasVideoIntegration: false,
      hasAPIAccess: false,
      hasDataExport: false,
      supportLevel: 'community',
      slaResponseHours: -1,
    },
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Para instituciones en crecimiento con múltiples cursos',
    priceCOP: 350000,
    annualPriceCOP: 3500000,
    displayOrder: 2,
    isPublic: true,
    isRecommended: true,
    limits: {
      maxStudents: 500,
      maxInstructors: 15,
      maxAdmins: 3,
      maxConcurrentUsers: 50,
      maxCourses: 20,
      maxActiveCohorts: 20,
      maxModulesPerCourse: 15,
      storageLimitMB: 5000,
      maxFileSizeMB: 100,
      maxDevices: 10,
      sessionRetentionDays: 365,
      hasAdvancedMetrics: true,
      hasAutomatedCohorts: true,
      hasAutoCertificates: true,
      hasCustomCertificates: false,
      hasAutoReminders: true,
      transactionFeePercent: 3.0,
      hasOwnPaymentGateway: false,
      hasDiscountCodes: true,
      hasWhiteLabel: false,
      hasCustomTheme: true,
      hasCustomDomain: false,
      hasCustomEmailDomain: false,
      hasVideoIntegration: true,
      hasAPIAccess: false,
      hasDataExport: true,
      supportLevel: 'email',
      slaResponseHours: 24,
    },
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Para grandes organizaciones con necesidades avanzadas',
    priceCOP: -1,
    annualPriceCOP: -1,
    displayOrder: 3,
    isPublic: true,
    isRecommended: false,
    limits: {
      maxStudents: UNLIMITED,
      maxInstructors: UNLIMITED,
      maxAdmins: UNLIMITED,
      maxConcurrentUsers: UNLIMITED,
      maxCourses: UNLIMITED,
      maxActiveCohorts: UNLIMITED,
      maxModulesPerCourse: UNLIMITED,
      storageLimitMB: UNLIMITED,
      maxFileSizeMB: 2000,
      maxDevices: UNLIMITED,
      sessionRetentionDays: UNLIMITED,
      hasAdvancedMetrics: true,
      hasAutomatedCohorts: true,
      hasAutoCertificates: true,
      hasCustomCertificates: true,
      hasAutoReminders: true,
      transactionFeePercent: 0,
      hasOwnPaymentGateway: true,
      hasDiscountCodes: true,
      hasWhiteLabel: true,
      hasCustomTheme: true,
      hasCustomDomain: true,
      hasCustomEmailDomain: true,
      hasVideoIntegration: true,
      hasAPIAccess: true,
      hasDataExport: true,
      supportLevel: 'dedicated',
      slaResponseHours: 2,
    },
  },
];
