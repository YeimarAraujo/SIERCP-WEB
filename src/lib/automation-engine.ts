/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SIERCP — Cohort Automation Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Core automation logic for Jomar Seguridad (and any AUTOMATED institution).
 * Handles the automatic lifecycle of cohorts:
 *   1. Detects when a cohort is FULL or its enrollment period has expired
 *   2. Closes the exhausted cohort
 *   3. Generates the next cohort(s) cloning the same course template
 *
 * This module is designed to run both:
 *   - Server-side via Next.js API Routes (cron endpoint)
 *   - As a Firebase Cloud Function trigger (future deployment)
 */

import admin from 'firebase-admin';

type Firestore = admin.firestore.Firestore;
type FieldValue = typeof admin.firestore.FieldValue;

// ─── Date Helpers ────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toFirestoreTimestamp(date: Date): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(date);
}

// ─── Core: Generate Next Cohort ──────────────────────────────────────────────

export interface GenerationResult {
  success: boolean;
  generatedCohortIds: string[];
  templateId: string;
  closedCohortId: string;
  error?: string;
}

/**
 * Generates the next cohort(s) for an automated course template.
 *
 * When a cohort becomes FULL or its enrollment window expires, this function:
 * 1. Reads the parent template's autoConfig
 * 2. Calculates dates for the next enrollment cycle
 * 3. Creates one new cohort per configured schedule slot
 *
 * @param dbAdmin - Firestore admin instance
 * @param templateId - The course template that owns the closed cohort
 * @param closedCohortId - The cohort that triggered the generation
 */
export async function generateNextCohort(
  dbAdmin: Firestore,
  templateId: string,
  closedCohortId: string,
): Promise<GenerationResult> {
  const result: GenerationResult = {
    success: false,
    generatedCohortIds: [],
    templateId,
    closedCohortId,
  };

  try {
    // ─── 1. Load template ──────────────────────────────────────────────────
    const templateSnap = await dbAdmin.collection('course_templates').doc(templateId).get();
    if (!templateSnap.exists) {
      result.error = `Template ${templateId} not found`;
      return result;
    }

    const template = templateSnap.data()!;
    if (!template.isAutomated || !template.autoConfig) {
      result.error = `Template ${templateId} is not configured for automation`;
      return result;
    }

    if (!template.autoConfig.autoRenew) {
      result.error = `Template ${templateId} has autoRenew disabled`;
      return result;
    }

    // ─── 2. Load closed cohort ─────────────────────────────────────────────
    const closedSnap = await dbAdmin.collection('cohorts').doc(closedCohortId).get();
    if (!closedSnap.exists) {
      result.error = `Cohort ${closedCohortId} not found`;
      return result;
    }

    const closedCohort = closedSnap.data()!;
    const { autoConfig } = template;

    const closedEnrollmentEnd = closedCohort.enrollmentEnd?.toDate?.();
    if (!closedEnrollmentEnd) {
      result.error = `Cohort ${closedCohortId} has no enrollmentEnd timestamp`;
      console.error(`[AutomationEngine] ${result.error}`);
      return result;
    }

    // ─── 3. Atomic check-and-create via runTransaction ───────────────────────
    const txResult = await dbAdmin.runTransaction(async (tx) => {
      const existingSnap = await tx.get(
        dbAdmin.collection('cohorts')
          .where('parentCohortId', '==', closedCohortId)
          .limit(1)
      );

      if (!existingSnap.empty) {
        return { success: true, generatedCohortIds: [] as string[], alreadyExists: true };
      }

      const nextEnrollmentStart = addDays(closedEnrollmentEnd, autoConfig.gapBetweenCyclesDays);
      const nextEnrollmentEnd = addDays(nextEnrollmentStart, autoConfig.enrollmentWindowDays);
      const nextClassesStart = addDays(nextEnrollmentEnd, 1);
      const now = new Date();
      const initialStatus = nextEnrollmentStart <= now ? 'OPEN' : 'UPCOMING';
      const nextCohortNumber = (closedCohort.cohortNumber || 1) + 1;
      const schedules = autoConfig.schedules || [{ label: 'Horario único', startTime: '08:00', endTime: '17:00' }];
      const ids: string[] = [];

      for (const schedule of schedules) {
        const cohortRef = dbAdmin.collection('cohorts').doc();
        tx.set(cohortRef, {
          templateId,
          institutionId: template.institutionId,
          courseSlug: template.slug,
          courseTitle: template.title,
          cohortNumber: nextCohortNumber,
          scheduleLabel: schedule.label,
          enrollmentStart: toFirestoreTimestamp(nextEnrollmentStart),
          enrollmentEnd: toFirestoreTimestamp(nextEnrollmentEnd),
          classesStart: toFirestoreTimestamp(nextClassesStart),
          maxStudents: autoConfig.maxStudentsPerGroup,
          enrolledCount: 0,
          priceCOP: template.priceCOP,
          priceUSD: template.priceUSD,
          status: initialStatus,
          isAutoGenerated: true,
          parentCohortId: closedCohortId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          closedAt: null,
        });
        ids.push(cohortRef.id);
      }

      return { success: true, generatedCohortIds: ids, alreadyExists: false };
    });

    if (txResult.alreadyExists) {
      result.success = true;
      result.error = `Next cohort already exists for parent ${closedCohortId}`;
      return result;
    }

    result.success = true;
    result.generatedCohortIds = txResult.generatedCohortIds;
    console.log(`[AutomationEngine] Generated ${result.generatedCohortIds.length} cohort(s) for template "${template.title}"`);
    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown automation error';
    console.error('[AutomationEngine] Error:', result.error);
    return result;
  }
}

// ─── Process Expired Cohorts (Cron Job Logic) ────────────────────────────────

export interface CronResult {
  processedCount: number;
  generatedCount: number;
  errors: string[];
}

/**
 * Scans for all OPEN cohorts whose enrollment period has expired,
 * closes them, and generates successor cohorts for automated templates.
 *
 * Designed to be called by a cron job (every hour).
 */
export async function processExpiredCohorts(dbAdmin: Firestore): Promise<CronResult> {
  const result: CronResult = { processedCount: 0, generatedCount: 0, errors: [] };

  try {
    const now = admin.firestore.Timestamp.now();

    // Find all OPEN cohorts with expired enrollment windows
    const expiredSnap = await dbAdmin.collection('cohorts')
      .where('status', '==', 'OPEN')
      .where('enrollmentEnd', '<=', now)
      .get();

    console.log(`[CronJob] Found ${expiredSnap.size} expired cohort(s) to process`);

    for (const cohortDoc of expiredSnap.docs) {
      const cohortData = cohortDoc.data();
      result.processedCount++;

      // Close the expired cohort
      await dbAdmin.collection('cohorts').doc(cohortDoc.id).update({
        status: 'IN_PROGRESS',
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Check if the parent template is automated
      const templateSnap = await dbAdmin.collection('course_templates').doc(cohortData.templateId).get();
      if (templateSnap.exists && templateSnap.data()?.isAutomated) {
        const genResult = await generateNextCohort(dbAdmin, cohortData.templateId, cohortDoc.id);
        if (genResult.success) {
          result.generatedCount += genResult.generatedCohortIds.length;
        } else if (genResult.error) {
          result.errors.push(genResult.error);
        }
      }
    }

    // Also check for UPCOMING cohorts that should now be OPEN
    const upcomingSnap = await dbAdmin.collection('cohorts')
      .where('status', '==', 'UPCOMING')
      .where('enrollmentStart', '<=', now)
      .get();

    for (const cohortDoc of upcomingSnap.docs) {
      const cohortData = cohortDoc.data();
      const enrollmentEnd = cohortData.enrollmentEnd?.toDate?.();
      if (!enrollmentEnd) continue;

      // Only open if enrollment period hasn't also already expired
      if (enrollmentEnd > now.toDate()) {
        await dbAdmin.collection('cohorts').doc(cohortDoc.id).update({
          status: 'OPEN',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[CronJob] Opened cohort ${cohortDoc.id} for enrollment`);
      }
    }

    console.log(
      `[CronJob] Complete: ${result.processedCount} processed, ${result.generatedCount} generated, ${result.errors.length} errors`,
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown cron error';
    result.errors.push(msg);
    console.error('[CronJob] Fatal error:', msg);
  }

  return result;
}

// ─── Handle Cohort Full Event ────────────────────────────────────────────────

/**
 * Called after an enrollment increments the cohort count.
 * If the cohort is now full, closes it and generates the next one.
 */
export async function handleCohortFull(
  dbAdmin: Firestore,
  cohortId: string,
): Promise<GenerationResult | null> {
  const cohortSnap = await dbAdmin.collection('cohorts').doc(cohortId).get();
  if (!cohortSnap.exists) return null;

  const cohort = cohortSnap.data()!;

  if (cohort.enrolledCount >= cohort.maxStudents && cohort.status === 'OPEN') {
    // Mark as FULL
    await dbAdmin.collection('cohorts').doc(cohortId).update({
      status: 'FULL',
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[AutomationEngine] Cohort ${cohortId} is FULL (${cohort.enrolledCount}/${cohort.maxStudents})`);

    // Check if template is automated
    const templateSnap = await dbAdmin.collection('course_templates').doc(cohort.templateId).get();
    if (templateSnap.exists && templateSnap.data()?.isAutomated) {
      return generateNextCohort(dbAdmin, cohort.templateId, cohortId);
    }
  }

  return null;
}
