import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/courses
 *
 * Public catalog endpoint. Returns active course templates
 * with their open cohorts, filtered by institution.
 *
 * Query params:
 *   - institution: (optional) Institution ID to filter by
 *   - slug: (optional) Filter by specific course slug
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institution');
    const slug = searchParams.get('slug');

    // ─── Build query for templates ─────────────────────────────────────────
    let templatesQuery = adminDb
      .collection('course_templates')
      .where('isActive', '==', true);

    if (institutionId) {
      templatesQuery = templatesQuery.where('institutionId', '==', institutionId);
    }

    if (slug) {
      templatesQuery = templatesQuery.where('slug', '==', slug);
    }

    const templatesSnap = await templatesQuery.get();

    // ─── For each template, fetch open cohorts ─────────────────────────────
    const courses = await Promise.all(
      templatesSnap.docs.map(async (templateDoc) => {
        const template = templateDoc.data();

        const cohortsSnap = await adminDb
          .collection('cohorts')
          .where('templateId', '==', templateDoc.id)
          .where('status', 'in', ['OPEN', 'UPCOMING'])
          .orderBy('enrollmentStart', 'asc')
          .get();

        const cohorts = cohortsSnap.docs.map((c) => ({
          id: c.id,
          ...c.data(),
          enrollmentStart: c.data().enrollmentStart?.toDate?.()?.toISOString() ?? null,
          enrollmentEnd: c.data().enrollmentEnd?.toDate?.()?.toISOString() ?? null,
          classesStart: c.data().classesStart?.toDate?.()?.toISOString() ?? null,
        }));

        // Get institution info
        let institutionName = '';
        if (template.institutionId) {
          const instSnap = await adminDb.collection('institutions').doc(template.institutionId).get();
          if (instSnap.exists) {
            institutionName = instSnap.data()?.name ?? '';
          }
        }

        return {
          id: templateDoc.id,
          slug: template.slug,
          title: template.title,
          description: template.description,
          descriptionLong: template.descriptionLong,
          level: template.level,
          modality: template.modality,
          duration: template.duration,
          sessions: template.sessions,
          priceCOP: template.priceCOP,
          priceUSD: template.priceUSD,
          objectives: template.objectives,
          requirements: template.requirements,
          includesCertificate: template.includesCertificate,
          regulations: template.regulations,
          tags: template.tags,
          icon: template.icon,
          targetAudience: template.targetAudience,
          modules: template.modules,
          institutionId: template.institutionId,
          institutionName,
          isAutomated: template.isAutomated,
          cohorts,
          availableSlots: cohorts
            .filter((c: any) => c.status === 'OPEN')
            .reduce((sum: number, c: any) => sum + (c.maxStudents - c.enrolledCount), 0),
        };
      }),
    );

    return NextResponse.json({ courses });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[API /api/courses] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
