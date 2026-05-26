/**
 * GET /api/debug/seed-courses
 *
 * Seeds course_templates and cohorts from the local cursos data.
 * PROTECTED: SUPER_ADMIN only in development. Returns 404 in production.
 * WARNING: Creates documents in Firestore — only run in dev/staging.
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/withAuth';
import { auditLog } from '@/lib/audit-logger';
import { getClientIp } from '@/lib/rate-limiter';
import { cursos } from '@/data/cursos';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const auth = await withAuth(req, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) {
    await auditLog({
      type: 'debug_access_blocked',
      severity: 'WARN',
      ip: getClientIp(req),
      metadata: { endpoint: '/api/debug/seed-courses', reason: 'unauthorized' },
    });
    return auth;
  }

  try {
    const batch = adminDb.batch();

    for (const curso of cursos) {
      const templateRef = adminDb.collection('course_templates').doc();

      const modules = curso.modulos.map((m, index) => {
        let type = 'teoria';
        const nameLower = m.nombre.toLowerCase();
        if (nameLower.includes('evaluación') || nameLower.includes('examen') || nameLower.includes('quiz')) {
          type = 'evaluacion_teorica';
        } else if (nameLower.includes('práctica') || nameLower.includes('rcp') || nameLower.includes('escenario')) {
          type = 'practica_guiada';
        }
        return {
          id: `mod-${index + 1}`,
          title: m.nombre,
          description: m.temas?.join(', ') || '',
          type,
          duration: m.duracion,
          order: index,
          isRequired: true,
        };
      });

      modules.push({
        id: `mod-${modules.length + 1}`,
        title: 'Certificación Final',
        description: 'Descarga de tu certificado',
        type: 'certificacion',
        duration: '0 horas',
        order: modules.length,
        isRequired: true,
      });

      batch.set(templateRef, {
        slug: curso.slug,
        title: curso.nombre,
        description: curso.descripcionLarga || curso.descripcion,
        institutionId: 'jomar-seguridad',
        institutionName: 'Jomar Seguridad',
        isActive: true,
        priceCOP: curso.precioCOP,
        createdAt: new Date(),
        modules,
      });

      const cohortRef = adminDb.collection('cohorts').doc(`grp-${curso.slug}-default`);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      batch.set(cohortRef, {
        templateId: templateRef.id,
        courseSlug: curso.slug,
        courseTitle: curso.nombre,
        institutionId: 'jomar-seguridad',
        status: 'abierto',
        classesStart: yesterday,
        maxStudents: 100,
        enrolledCount: 0,
        createdAt: new Date(),
      });
    }

    await batch.commit();

    await auditLog({
      type: 'super_admin_action',
      userId: auth.uid,
      severity: 'INFO',
      ip: getClientIp(req),
      metadata: { action: 'seed-courses', cursosCount: cursos.length },
    });

    return NextResponse.json({ message: 'Migración exitosa' }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    );
  }
}
