import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type { PlanLimits } from '@/shared/types/plan';
import type { Institution, InstitutionPlan } from '@/shared/types/institution';
import { DEFAULT_PLANS } from '@/shared/types/plan';

/**
 * Quota enforcement service. Checks institution resource usage against
 * their plan limits before allowing resource creation.
 */
export const QuotaService = {
  /**
   * Get the plan limits for an institution.
   * First checks for a custom plan in Firestore, then falls back to defaults.
   */
  async getLimits(institutionId: string): Promise<PlanLimits> {
    if (!db) throw new Error('Firebase not configured');

    // Get institution to find its plan
    const instDoc = await getDoc(doc(db, 'institutions', institutionId));
    if (!instDoc.exists()) throw new Error(`Institution ${institutionId} not found`);

    const inst = instDoc.data() as Institution;

    // Check for custom plan override in Firestore
    const planDoc = await getDoc(doc(db, 'plans', institutionId));
    if (planDoc.exists()) {
      return planDoc.data() as PlanLimits;
    }

    // Fall back to default plan limits
    const defaultPlan = DEFAULT_PLANS.find(p => p.slug === inst.plan);
    if (!defaultPlan) {
      // Fallback to 'starter' if plan not found
      return DEFAULT_PLANS[0].limits;
    }

    return defaultPlan.limits;
  },

  /**
   * Get current resource usage counts for an institution.
   */
  async getUsage(institutionId: string): Promise<Record<string, number>> {
    if (!db) throw new Error('Firebase not configured');

    const counts: Record<string, number> = {};

    // Count students
    const studentsQ = query(
      collection(db, 'users'),
      where('institutionId', '==', institutionId),
      where('role', '==', 'student')
    );
    const studentsSnap = await getDocs(studentsQ);
    counts.students = studentsSnap.size;

    // Count instructors
    const instructorsQ = query(
      collection(db, 'users'),
      where('institutionId', '==', institutionId),
      where('role', '==', 'instructor')
    );
    const instructorsSnap = await getDocs(instructorsQ);
    counts.instructors = instructorsSnap.size;

    // Count admins
    const adminsQ = query(
      collection(db, 'users'),
      where('institutionId', '==', institutionId),
      where('role', '==', 'admin')
    );
    const adminsSnap = await getDocs(adminsQ);
    counts.admins = adminsSnap.size;

    // Count course templates
    const coursesQ = query(
      collection(db, 'course_templates'),
      where('institutionId', '==', institutionId)
    );
    const coursesSnap = await getDocs(coursesQ);
    counts.courses = coursesSnap.size;

    // Count active cohorts
    const cohortsQ = query(
      collection(db, 'cohorts'),
      where('institutionId', '==', institutionId),
      where('status', 'in', ['OPEN', 'SCHEDULED'])
    );
    const cohortsSnap = await getDocs(cohortsQ);
    counts.activeCohorts = cohortsSnap.size;

    // Count devices
    const devicesQ = query(
      collection(db, 'devices'),
      where('institutionId', '==', institutionId)
    );
    const devicesSnap = await getDocs(devicesQ);
    counts.devices = devicesSnap.size;

    return counts;
  },

  /**
   * Check if a specific resource creation is allowed under the plan.
   * Returns { allowed: true } or { allowed: false, reason: string }.
   */
  async checkQuota(
    institutionId: string,
    resource: 'student' | 'instructor' | 'admin' | 'course' | 'cohort' | 'device'
  ): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
    const limits = await this.getLimits(institutionId);
    const usage = await this.getUsage(institutionId);

    const UNLIMITED = -1;

    const checks: Record<string, { current: number; max: number; label: string }> = {
      student: { current: usage.students || 0, max: limits.maxStudents, label: 'estudiantes' },
      instructor: { current: usage.instructors || 0, max: limits.maxInstructors, label: 'instructores' },
      admin: { current: usage.admins || 0, max: limits.maxAdmins, label: 'administradores' },
      course: { current: usage.courses || 0, max: limits.maxCourses, label: 'cursos' },
      cohort: { current: usage.activeCohorts || 0, max: limits.maxActiveCohorts, label: 'cohortes activas' },
      device: { current: usage.devices || 0, max: limits.maxDevices, label: 'dispositivos' },
    };

    const check = checks[resource];
    if (!check) return { allowed: true };

    // -1 means unlimited
    if (check.max === UNLIMITED) {
      return { allowed: true, current: check.current, limit: check.max };
    }

    if (check.current >= check.max) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${check.max} ${check.label} en tu plan. Actualiza tu plan para agregar más.`,
        current: check.current,
        limit: check.max,
      };
    }

    return { allowed: true, current: check.current, limit: check.max };
  },

  /**
   * Check if a feature is enabled for an institution's plan.
   */
  async checkFeature(
    institutionId: string,
    feature: keyof PlanLimits
  ): Promise<{ enabled: boolean; reason?: string }> {
    const limits = await this.getLimits(institutionId);
    const value = limits[feature];

    if (typeof value === 'boolean') {
      if (!value) {
        return {
          enabled: false,
          reason: `Esta función no está disponible en tu plan actual. Actualiza tu plan para acceder a esta característica.`,
        };
      }
      return { enabled: true };
    }

    // For numeric values, check if they're > 0 or unlimited
    if (typeof value === 'number' && value === 0) {
      return {
        enabled: false,
        reason: `Esta función no está disponible en tu plan actual.`,
      };
    }

    return { enabled: true };
  },

  /**
   * Get a summary of plan usage vs limits for dashboard display.
   */
  async getUsageSummary(institutionId: string): Promise<{
    plan: string;
    usage: { label: string; current: number; max: number; percentage: number }[];
    features: { label: string; enabled: boolean }[];
  }> {
    const limits = await this.getLimits(institutionId);
    const usage = await this.getUsage(institutionId);

    const instDoc = await getDoc(doc(db!, 'institutions', institutionId));
    const plan = instDoc.exists() ? (instDoc.data() as Institution).plan : 'starter';

    const pct = (current: number, max: number) =>
      max === -1 ? 0 : max === 0 ? 100 : Math.round((current / max) * 100);

    return {
      plan,
      usage: [
        { label: 'Estudiantes', current: usage.students || 0, max: limits.maxStudents, percentage: pct(usage.students || 0, limits.maxStudents) },
        { label: 'Instructores', current: usage.instructors || 0, max: limits.maxInstructors, percentage: pct(usage.instructors || 0, limits.maxInstructors) },
        { label: 'Cursos', current: usage.courses || 0, max: limits.maxCourses, percentage: pct(usage.courses || 0, limits.maxCourses) },
        { label: 'Cohortes activas', current: usage.activeCohorts || 0, max: limits.maxActiveCohorts, percentage: pct(usage.activeCohorts || 0, limits.maxActiveCohorts) },
        { label: 'Dispositivos', current: usage.devices || 0, max: limits.maxDevices, percentage: pct(usage.devices || 0, limits.maxDevices) },
      ],
      features: [
        { label: 'Cohortes automáticas', enabled: limits.hasAutomatedCohorts },
        { label: 'Certificados automáticos', enabled: limits.hasAutoCertificates },
        { label: 'Certificados personalizados', enabled: limits.hasCustomCertificates },
        { label: 'Marca blanca', enabled: limits.hasWhiteLabel },
        { label: 'Pasarela propia', enabled: limits.hasOwnPaymentGateway },
        { label: 'API & Webhooks', enabled: limits.hasAPIAccess },
        { label: 'Métricas avanzadas', enabled: limits.hasAdvancedMetrics },
        { label: 'Integración de video', enabled: limits.hasVideoIntegration },
        { label: 'Exportación de datos', enabled: limits.hasDataExport },
      ],
    };
  },
};
