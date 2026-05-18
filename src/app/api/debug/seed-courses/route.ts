import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { cursos } from '@/data/cursos';

export async function GET() {
  try {
    const batch = adminDb.batch();
    
    for (const curso of cursos) {
      // 1. Create Course Template
      const templateRef = adminDb.collection('course_templates').doc();
      
      const modules = curso.modulos.map((m, index) => {
        // Determine type based on name heuristics
        let type = 'teoria'; // Default (documents, links, videos)
        const nameLower = m.nombre.toLowerCase();
        if (nameLower.includes('evaluación') || nameLower.includes('examen') || nameLower.includes('quiz')) {
          type = 'evaluacion_teorica';
        } else if (nameLower.includes('práctica') || nameLower.includes('rcp') || nameLower.includes('escenario')) {
          type = 'practica_guiada'; // Interactive RCP scenario
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

      // Add a certification module at the end
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

      // 2. Create Cohort for the template
      // Setting classesStart to yesterday so it is unlocked immediately
      const cohortRef = adminDb.collection('cohorts').doc(`grp-${curso.slug}-default`);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      batch.set(cohortRef, {
        templateId: templateRef.id,
        courseSlug: curso.slug,
        courseTitle: curso.nombre,
        institutionId: 'jomar-seguridad',
        status: 'abierto',
        classesStart: yesterday, // Unlocked
        maxStudents: 100,
        enrolledCount: 0,
        createdAt: new Date(),
      });
    }

    await batch.commit();

    return NextResponse.json({ message: 'Migración exitosa' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
