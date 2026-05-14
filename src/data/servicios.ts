export interface Servicio {
  slug: string;
  nombre: string;
  descripcion: string;
  descripcionLarga: string;
  entregables: string[];
  paraQuien: string;
  normativa: string[];
  precioDesdeCOP: number;
  tags: string[];
  icono: string;
  esServicioCorporativo: true;
  proceso: { paso: number; titulo: string; descripcion: string }[];
  industrias: { nombre: string; icono: string }[];
}

export const servicios: Servicio[] = [
  {
    slug: 'brigada-de-emergencia',
    nombre: 'Brigada de Emergencia',
    descripcion: 'Conformación, entrenamiento y certificación de brigadas empresariales en prevención, evacuación y respuesta.',
    descripcionLarga: 'Servicio integral de conformación y capacitación de brigadas de emergencia empresariales. Incluye la evaluación del riesgo organizacional, selección de brigadistas, entrenamiento teórico-práctico en evacuación, control de incendios y primeros auxilios, y certificación final conforme a la normativa colombiana vigente.',
    entregables: [
      'Diagnóstico de riesgo organizacional',
      'Plan de conformación de brigada',
      'Capacitación teórico-práctica (16-40 horas)',
      'Simulacro de validación',
      'Certificación individual de brigadistas',
      'Informe técnico final con recomendaciones',
      'Material de apoyo digital',
    ],
    paraQuien: 'Empresas de todos los tamaños que requieran cumplir con la normativa de seguridad y salud en el trabajo.',
    normativa: ['Resolución 0256', 'Decreto 1072', 'QHSE', 'MinTrabajo'],
    precioDesdeCOP: 1000000,
    tags: ['Evacuación', 'Incendios', 'QHSE'],
    icono: 'bi-shield-check',
    esServicioCorporativo: true,
    proceso: [
      { paso: 1, titulo: 'Diagnóstico inicial', descripcion: 'Evaluación del riesgo y necesidades de la organización' },
      { paso: 2, titulo: 'Propuesta personalizada', descripcion: 'Plan de trabajo adaptado al tamaño y sector de la empresa' },
      { paso: 3, titulo: 'Ejecución', descripcion: 'Capacitación teórico-práctica con simulacros reales' },
      { paso: 4, titulo: 'Certificación y cierre', descripcion: 'Entrega de certificaciones individuales e informe técnico' },
    ],
    industrias: [
      { nombre: 'Hospitales', icono: 'bi-hospital' },
      { nombre: 'Empresas', icono: 'bi-building' },
      { nombre: 'Colegios', icono: 'bi-mortarboard' },
      { nombre: 'Industria', icono: 'bi-gear' },
    ],
  },
  {
    slug: 'planes-de-contingencia',
    nombre: 'Asesoría en Planes de Contingencia y Emergencia',
    descripcion: 'Asesoría técnica y elaboración de planes de emergencia y contingencia ajustados a la normativa colombiana vigente.',
    descripcionLarga: 'Servicio de consultoría especializada para la elaboración de Planes de Emergencia y Contingencia conforme a la legislación colombiana. Incluye análisis de amenazas, vulnerabilidad, riesgo, diseño de procedimientos operativos normalizados (PON), rutas de evacuación y protocolos de respuesta.',
    entregables: [
      'Análisis de amenazas y vulnerabilidad',
      'Plan de Emergencia y Contingencia completo',
      'Procedimientos Operativos Normalizados (PON)',
      'Planos de evacuación',
      'Señalización de seguridad recomendada',
      'Socialización del plan con el personal',
      'Documento digital y físico',
    ],
    paraQuien: 'Empresas, instituciones educativas, centros de salud y cualquier organización que requiera cumplir con la normativa de prevención de emergencias.',
    normativa: ['Ley 1523/2012', 'Decreto 1072', 'NTC 1461', 'PGRSS'],
    precioDesdeCOP: 150000,
    tags: ['PGRSS', 'Asesoría', 'Empresas'],
    icono: 'bi-file-earmark-text',
    esServicioCorporativo: true,
    proceso: [
      { paso: 1, titulo: 'Diagnóstico inicial', descripcion: 'Visita técnica y levantamiento de información de la organización' },
      { paso: 2, titulo: 'Propuesta personalizada', descripcion: 'Diseño del alcance del plan según las necesidades identificadas' },
      { paso: 3, titulo: 'Ejecución', descripcion: 'Elaboración del plan, planos y protocolos' },
      { paso: 4, titulo: 'Certificación y cierre', descripcion: 'Socialización, entrega formal y capacitación del personal' },
    ],
    industrias: [
      { nombre: 'Hospitales', icono: 'bi-hospital' },
      { nombre: 'Empresas', icono: 'bi-building' },
      { nombre: 'Colegios', icono: 'bi-mortarboard' },
      { nombre: 'Piscinas', icono: 'bi-water' },
    ],
  },
  {
    slug: 'elaboracion-de-simulacros',
    nombre: 'Asesoría en Elaboración de Simulacros',
    descripcion: 'Diseño, coordinación y evaluación de simulacros de emergencia para empresas, colegios e instituciones.',
    descripcionLarga: 'Servicio completo de diseño, planificación, ejecución y evaluación de simulacros de emergencia. Incluye definición de escenarios, guiones técnicos, coordinación operativa el día del simulacro, registro fotográfico y videográfico, y entrega de informe con recomendaciones de mejora.',
    entregables: [
      'Diseño del escenario y guion técnico',
      'Coordinación logística y operativa',
      'Ejecución del simulacro con evaluadores',
      'Registro fotográfico y videográfico',
      'Informe de evaluación con indicadores',
      'Recomendaciones de mejora',
      'Acta de ejecución del simulacro',
    ],
    paraQuien: 'Empresas, instituciones educativas, hospitales y organizaciones que necesiten validar sus planes de emergencia.',
    normativa: ['Decreto 1072', 'Resolución 0256', 'QHSE'],
    precioDesdeCOP: 200000,
    tags: ['Diseño', 'Coordinación', 'Evaluación'],
    icono: 'bi-diagram-3',
    esServicioCorporativo: true,
    proceso: [
      { paso: 1, titulo: 'Diagnóstico inicial', descripcion: 'Revisión del plan de emergencia existente y definición de escenarios' },
      { paso: 2, titulo: 'Propuesta personalizada', descripcion: 'Diseño del guion técnico y plan logístico del simulacro' },
      { paso: 3, titulo: 'Ejecución', descripcion: 'Coordinación y ejecución del simulacro con evaluadores en terreno' },
      { paso: 4, titulo: 'Certificación y cierre', descripcion: 'Informe de resultados, indicadores de desempeño y plan de mejora' },
    ],
    industrias: [
      { nombre: 'Empresas', icono: 'bi-building' },
      { nombre: 'Colegios', icono: 'bi-mortarboard' },
      { nombre: 'Hospitales', icono: 'bi-hospital' },
      { nombre: 'Industria', icono: 'bi-gear' },
    ],
  },
];

export function getServicioBySlug(slug: string): Servicio | undefined {
  return servicios.find(s => s.slug === slug);
}

export function getWhatsAppLink(servicioNombre: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000';
  const message = encodeURIComponent(`Hola, estoy interesado en: ${servicioNombre}. Me gustaría recibir más información y una cotización personalizada.`);
  return `https://wa.me/${phone}?text=${message}`;
}
