import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

/**
 * POST /api/seed/jomar
 *
 * Seeds the Firestore database with Jomar Seguridad's institution,
 * course templates, and initial cohorts.
 *
 * WARNING: This endpoint should be disabled or protected in production.
 * It creates the foundational data that was previously hardcoded in data/cursos.ts.
 *
 * Security: Protected by CRON_SECRET.
 */

// ─── Jomar Course Definitions (migrated from data/cursos.ts) ─────────────────

const JOMAR_COURSES = [
  {
    slug: 'rcp',
    title: 'RCP',
    description: 'Reanimación Cardiopulmonar bajo protocolos AHA y ERC para adultos, niños y neonatos. Incluye uso del DEA.',
    descriptionLong: 'Curso completo de Reanimación Cardiopulmonar que abarca las técnicas de compresión torácica, ventilación y uso del Desfibrilador Externo Automático (DEA). Basado en los protocolos más actualizados de la American Heart Association (AHA) 2025 y el European Resuscitation Council (ERC). Incluye práctica con maniquíes SIERCP de alta fidelidad.',
    level: 'intermedio',
    modality: 'presencial',
    duration: '8 horas',
    sessions: 2,
    priceCOP: 80000,
    priceUSD: 21,
    objectives: [
      'Identificar una parada cardiorrespiratoria',
      'Ejecutar la cadena de supervivencia completa',
      'Realizar compresiones torácicas de alta calidad (50-60mm, 100-120/min)',
      'Aplicar ventilaciones efectivas con barrera y BVM',
      'Usar correctamente un DEA',
      'Adaptar la técnica a adultos, niños y neonatos',
    ],
    requirements: ['Mayor de 16 años', 'Documento de identidad vigente', 'Ropa cómoda para práctica'],
    regulations: ['AHA 2025', 'ERC', 'MinSalud'],
    tags: ['Adultos', 'Pediátrico', 'DEA', 'AHA · ERC'],
    icon: 'bi-heart-pulse',
    targetAudience: 'Profesionales de la salud, brigadistas, docentes, personal de seguridad y cualquier persona interesada en salvar vidas.',
    modules: [
      { title: 'Fundamentos de RCP', topics: ['Cadena de supervivencia', 'Reconocimiento de PCR', 'Activación de SEM'], duration: '2 horas', order: 0 },
      { title: 'Técnicas de Compresión', topics: ['Posición correcta', 'Profundidad y frecuencia', 'Retroceso completo', 'Feedback con SIERCP'], duration: '3 horas', order: 1 },
      { title: 'Ventilación y DEA', topics: ['Apertura de vía aérea', 'Ventilación con BVM', 'Uso del DEA', 'Escenarios integrados'], duration: '3 horas', order: 2 },
    ],
  },
  {
    slug: 'soporte-vital-basico',
    title: 'Soporte Vital Básico',
    description: 'Integración de RCP, manejo de vía aérea y DEA. Ideal para personal de salud, educadores y brigadistas.',
    descriptionLong: 'El curso de Soporte Vital Básico (SVB/BLS) es una formación integral que combina las técnicas de RCP con el manejo avanzado de la vía aérea y dispositivos de emergencia.',
    level: 'intermedio',
    modality: 'presencial',
    duration: '12 horas',
    sessions: 3,
    priceCOP: 200000,
    priceUSD: 53,
    objectives: ['Dominar el protocolo BLS completo', 'Manejar obstrucción de vía aérea (OVACE)', 'Realizar RCP de alta calidad con feedback SIERCP', 'Trabajar en equipo de reanimación', 'Obtener certificación BLS Provider'],
    requirements: ['Mayor de 18 años', 'Documento de identidad vigente', 'Recomendado: experiencia previa en RCP'],
    regulations: ['AHA 2025', 'MinSalud'],
    tags: ['SVB', 'Cadena de supervivencia', 'BLS'],
    icon: 'bi-activity',
    targetAudience: 'Personal de salud, paramédicos, enfermeros, médicos en formación, brigadistas certificados.',
    modules: [
      { title: 'Evaluación Primaria', topics: ['Escena segura', 'Evaluación rápida', 'Activación del SEM'], duration: '2 horas', order: 0 },
      { title: 'RCP de Alta Calidad', topics: ['Compresiones profesionales', 'Relación C:V', 'Trabajo en equipo'], duration: '4 horas', order: 1 },
      { title: 'Manejo de Vía Aérea', topics: ['Técnicas manuales', 'Dispositivos básicos', 'OVACE'], duration: '3 horas', order: 2 },
      { title: 'Escenarios Integrados', topics: ['Megacode', 'Evaluación práctica', 'Certificación'], duration: '3 horas', order: 3 },
    ],
  },
  {
    slug: 'primeros-auxilios',
    title: 'Primeros Auxilios',
    description: 'Atención inicial ante hemorragias, fracturas, quemaduras, intoxicaciones, obstrucción de vía aérea y más.',
    descriptionLong: 'Formación completa en primeros auxilios para emergencias frecuentes en entornos laborales, educativos y domésticos.',
    level: 'basico',
    modality: 'presencial',
    duration: '8 horas',
    sessions: 2,
    priceCOP: 100000,
    priceUSD: 26,
    objectives: ['Evaluar la escena y la víctima correctamente', 'Controlar hemorragias y aplicar torniquetes', 'Inmovilizar fracturas y luxaciones', 'Manejar quemaduras de primer y segundo grado', 'Atender intoxicaciones y reacciones alérgicas'],
    requirements: ['Mayor de 16 años', 'Documento de identidad vigente'],
    regulations: ['MinSalud', 'Cruz Roja'],
    tags: ['Básico', 'Avanzado', 'In-company'],
    icon: 'bi-bandaid',
    targetAudience: 'Público general, trabajadores, docentes, padres de familia.',
    modules: [
      { title: 'Evaluación de la Emergencia', topics: ['Escena segura', 'Evaluación primaria', 'Llamada al SEM'], duration: '2 horas', order: 0 },
      { title: 'Hemorragias y Heridas', topics: ['Control de hemorragias', 'Torniquete', 'Vendaje compresivo'], duration: '2 horas', order: 1 },
      { title: 'Trauma y Quemaduras', topics: ['Fracturas', 'Inmovilización', 'Quemaduras', 'Intoxicaciones'], duration: '4 horas', order: 2 },
    ],
  },
  {
    slug: 'seguridad-salvamento-piscina',
    title: 'Seguridad y Salvamento en Piscina',
    description: 'Formación de salvavidas y socorristas acuáticos con técnicas de rescate y prevención de ahogamientos.',
    descriptionLong: 'Programa certificado de formación de socorristas acuáticos con práctica en piscina real.',
    level: 'avanzado',
    modality: 'presencial',
    duration: '40 horas',
    sessions: 10,
    priceCOP: 300000,
    priceUSD: 80,
    objectives: ['Dominar técnicas de rescate acuático', 'Prevenir ahogamientos', 'Aplicar primeros auxilios acuáticos', 'Gestionar emergencias en instalaciones acuáticas'],
    requirements: ['Mayor de 18 años', 'Saber nadar (mínimo 200m sin parar)', 'Certificado médico de aptitud'],
    regulations: ['MinSalud', 'Resolución 0256'],
    tags: ['Salvavidas', 'Rescate acuático', 'Certificación'],
    icon: 'bi-life-preserver',
    targetAudience: 'Aspirantes a salvavidas, personal de piscinas, clubes deportivos.',
    modules: [
      { title: 'Seguridad Acuática', topics: ['Prevención', 'Normativa', 'Protocolos de piscina'], duration: '8 horas', order: 0 },
      { title: 'Técnicas de Rescate', topics: ['Rescate sin contacto', 'Rescate con contacto', 'Rescate con equipo'], duration: '16 horas', order: 1 },
      { title: 'Primeros Auxilios Acuáticos', topics: ['Ahogamiento', 'Hipotermia', 'Lesiones cervicales'], duration: '8 horas', order: 2 },
      { title: 'Gestión de Emergencias', topics: ['Plan de emergencia', 'Comunicación', 'Evacuación'], duration: '8 horas', order: 3 },
    ],
  },
  {
    slug: 'natacion-personalizada',
    title: 'Natación Personalizada',
    description: 'Clases individuales y grupales adaptadas a todos los niveles, enfocadas en técnica y seguridad acuática.',
    descriptionLong: 'Programa de natación adaptado a las necesidades individuales del estudiante.',
    level: 'basico',
    modality: 'presencial',
    duration: '1 mes',
    sessions: 6,
    priceCOP: 150000,
    priceUSD: 40,
    objectives: ['Familiarizarse con el medio acuático', 'Aprender los 4 estilos de natación', 'Mejorar la técnica de respiración', 'Desarrollar resistencia y confianza en el agua'],
    requirements: ['No se requiere experiencia previa', 'Traje de baño y gafas de natación'],
    regulations: [],
    tags: ['Todos los niveles', 'Individual', 'Grupal'],
    icon: 'bi-water',
    targetAudience: 'Niños, jóvenes y adultos de cualquier nivel.',
    modules: [
      { title: 'Familiarización', topics: ['Flotación', 'Respiración', 'Desplazamiento básico'], duration: '4 horas', order: 0 },
      { title: 'Estilos', topics: ['Crol', 'Espalda', 'Pecho', 'Mariposa'], duration: '6 horas', order: 1 },
      { title: 'Perfeccionamiento', topics: ['Técnica avanzada', 'Resistencia', 'Evaluación final'], duration: '2 horas', order: 2 },
    ],
  },
  {
    slug: 'manejo-de-extintor',
    title: 'Manejo de Extintor',
    description: 'Identificación de tipos de fuego, clasificación de extintores y técnica práctica de extinción segura.',
    descriptionLong: 'Capacitación práctica en el manejo correcto de extintores portátiles.',
    level: 'basico',
    modality: 'presencial',
    duration: '4 horas',
    sessions: 1,
    priceCOP: 80000,
    priceUSD: 21,
    objectives: ['Identificar los tipos de fuego', 'Seleccionar el extintor correcto', 'Aplicar la técnica PASS', 'Conocer las normas de seguridad contra incendios'],
    requirements: ['Mayor de 16 años', 'Ropa cómoda para práctica exterior'],
    regulations: ['NFPA', 'MinTrabajo'],
    tags: ['PASS', 'Clases A·B·C', 'Práctica real'],
    icon: 'bi-fire',
    targetAudience: 'Brigadistas, personal de seguridad, trabajadores en general.',
    modules: [
      { title: 'Teoría del Fuego', topics: ['Triángulo del fuego', 'Tipos de fuego', 'Clasificación de extintores'], duration: '1.5 horas', order: 0 },
      { title: 'Práctica Real', topics: ['Técnica PASS', 'Simulacro con fuego real', 'Evaluación'], duration: '2.5 horas', order: 1 },
    ],
  },
];

const JOMAR_AUTO_CONFIG = {
  maxStudentsPerGroup: 40,
  enrollmentWindowDays: 21,
  gapBetweenCyclesDays: 15,
  schedules: [
    { label: 'Único Horario', startTime: '07:00', endTime: '18:00' },
  ],
  autoRenew: true,
};

// ─── Seed Endpoint ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const results: string[] = [];

    // ─── 1. Create Jomar Institution ───────────────────────────────────────
    const institutionRef = adminDb.collection('institutions').doc('jomar-seguridad');
    const institutionSnap = await institutionRef.get();

    let institutionId = 'jomar-seguridad';

    if (!institutionSnap.exists) {
      await institutionRef.set({
        name: 'Jomar Seguridad',
        code: 'JOMAR',
        mode: 'AUTOMATED',
        nit: '900.000.000-0',
        description: 'Centro de formación en seguridad, rescate acuático y primeros auxilios.',
        address: 'Colombia',
        city: 'Barranquilla',
        country: 'Colombia',
        phone: '+57 300 000 0000',
        email: 'info@jomarseguridad.com',
        contactEmail: 'inscripciones@jomarseguridad.com',
        contactPhone: '+57 300 000 0000',
        logoUrl: null,
        adminIds: [],
        plan: 'enterprise',
        status: 'active',
        maxDevices: 50,
        maxInstructors: 20,
        maxStudents: 1000,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system-seed',
      });
      results.push('✅ Institución "Jomar Seguridad" creada');
    } else {
      // Update mode if needed
      await institutionRef.update({ mode: 'AUTOMATED', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      results.push('🔄 Institución "Jomar Seguridad" actualizada con mode=AUTOMATED');
    }

    // ─── 2. Create Course Templates ────────────────────────────────────────
    const templateIds: Record<string, string> = {};

    for (const course of JOMAR_COURSES) {
      // Check if already exists
      const existingSnap = await adminDb.collection('course_templates')
        .where('institutionId', '==', institutionId)
        .where('slug', '==', course.slug)
        .limit(1)
        .get();

      let templateId: string;

      if (existingSnap.empty) {
        const ref = adminDb.collection('course_templates').doc();
        templateId = ref.id;

        await ref.set({
          ...course,
          institutionId,
          includesCertificate: true,
          isAutomated: true,
          autoConfig: JOMAR_AUTO_CONFIG,
          isActive: true,
          createdBy: 'system-seed',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        results.push(`✅ Template "${course.title}" creado (${templateId})`);
      } else {
        templateId = existingSnap.docs[0].id;
        results.push(`🔄 Template "${course.title}" ya existe (${templateId})`);
      }

      templateIds[course.slug] = templateId;
    }

    // ─── 3. Create Initial Cohorts ─────────────────────────────────────────
    const now = new Date();
    const enrollmentStart = now;
    const enrollmentEnd = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const classesStart = new Date(enrollmentEnd.getTime() + 1 * 24 * 60 * 60 * 1000);

    for (const [slug, templateId] of Object.entries(templateIds)) {
      // Check if cohorts already exist for this template
      const existingCohorts = await adminDb.collection('cohorts')
        .where('templateId', '==', templateId)
        .where('status', 'in', ['OPEN', 'UPCOMING'])
        .limit(1)
        .get();

      if (!existingCohorts.empty) {
        results.push(`🔄 Cohortes activas ya existen para "${slug}"`);
        continue;
      }

      const course = JOMAR_COURSES.find(c => c.slug === slug)!;

      for (const schedule of JOMAR_AUTO_CONFIG.schedules) {
        const cohortRef = adminDb.collection('cohorts').doc();
        await cohortRef.set({
          templateId,
          institutionId,
          courseSlug: slug,
          courseTitle: course.title,
          cohortNumber: 1,
          scheduleLabel: schedule.label,
          enrollmentStart: admin.firestore.Timestamp.fromDate(enrollmentStart),
          enrollmentEnd: admin.firestore.Timestamp.fromDate(enrollmentEnd),
          classesStart: admin.firestore.Timestamp.fromDate(classesStart),
          maxStudents: JOMAR_AUTO_CONFIG.maxStudentsPerGroup,
          enrolledCount: 0,
          priceCOP: course.priceCOP,
          priceUSD: course.priceUSD,
          status: 'OPEN',
          isAutoGenerated: false,
          parentCohortId: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          closedAt: null,
        });

        results.push(`✅ Cohorte #1 "${course.title}" [${schedule.label}] creada`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Seed de Jomar Seguridad completado',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error en seed';
    console.error('[Seed] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
