export interface Grupo {
  id: string;
  horario: 'mañana' | 'tarde';
  horarioLabel: string;
  inscripcionInicio: Date;
  inscripcionFin: Date;
  inicioClases: Date;
  maxEstudiantes: number;
  inscritos: number;
  estado: 'proximo' | 'abierto' | 'agotado' | 'en_curso' | 'finalizado';
}

export interface Curso {
  slug: string;
  nombre: string;
  descripcion: string;
  descripcionLarga: string;
  nivel: 'basico' | 'intermedio' | 'avanzado';
  modalidad: 'presencial' | 'virtual' | 'hibrida';
  duracion: string;
  sesiones: number;
  precioCOP: number;
  precioUSD: number;
  objetivos: string[];
  requisitos: string[];
  incluyeCertificado: boolean;
  normativa: string[];
  tags: string[];
  icono: string;
  grupos: Grupo[];
  modulos: { nombre: string; temas: string[]; duracion: string }[];
  paraQuien: string;
}

/**
 * Genera ciclos de inscripción automáticos.
 * Inicializa siempre con 0 inscritos para ser llenados por la DB real.
 */
function generarGruposCiclicos(baseDate: Date): Grupo[] {
  const now = new Date();
  let cycleStart = new Date(baseDate);
  let cycleGroups: Grupo[] = [];

  let safety = 0;
  while (safety < 20) {
    safety++;
    const inicio = new Date(cycleStart);
    const fin = new Date(cycleStart);
    fin.setDate(fin.getDate() + 21);

    const inicioClases = new Date(fin);
    inicioClases.setDate(inicioClases.getDate() + 1);

    let estado: Grupo['estado'];
    if (now < inicio) {
      estado = 'proximo';
    } else if (now >= inicio && now <= fin) {
      estado = 'abierto';
    } else {
      estado = 'finalizado';
    }

    if (estado !== 'finalizado') {
      cycleGroups.push({
        id: `grp-m-${cycleStart.getTime()}`,
        horario: 'mañana',
        horarioLabel: '7:00 AM - 11:00 AM',
        inscripcionInicio: new Date(inicio),
        inscripcionFin: new Date(fin),
        inicioClases: new Date(inicioClases),
        maxEstudiantes: 40,
        inscritos: 0,
        estado: estado,
      });

      cycleGroups.push({
        id: `grp-t-${cycleStart.getTime()}`,
        horario: 'tarde',
        horarioLabel: '2:00 PM - 6:00 PM',
        inscripcionInicio: new Date(inicio),
        inscripcionFin: new Date(fin),
        inicioClases: new Date(inicioClases),
        maxEstudiantes: 40,
        inscritos: 0,
        estado: estado,
      });
      break;
    }

    cycleStart = new Date(fin);
    cycleStart.setDate(cycleStart.getDate() + 15);
  }

  return cycleGroups;
}

export const cursos: Curso[] = [
  {
    slug: 'rcp',
    nombre: 'RCP',
    descripcion: 'Reanimación Cardiopulmonar bajo protocolos AHA y ERC para adultos, niños y neonatos. Incluye uso del DEA.',
    descripcionLarga: 'Curso completo de Reanimación Cardiopulmonar que abarca las técnicas de compresión torácica, ventilación y uso del Desfibrilador Externo Automático (DEA). Basado en los protocolos más actualizados de la American Heart Association (AHA) 2025 y el European Resuscitation Council (ERC). Incluye práctica con maniquíes SIERCP de alta fidelidad.',
    nivel: 'intermedio',
    modalidad: 'presencial',
    duracion: '8 horas',
    sesiones: 2,
    precioCOP: 80000,
    precioUSD: 21,
    objetivos: [
      'Identificar una parada cardiorrespiratoria',
      'Ejecutar la cadena de supervivencia completa',
      'Realizar compresiones torácicas de alta calidad (50-60mm, 100-120/min)',
      'Aplicar ventilaciones efectivas con barrera y BVM',
      'Usar correctamente un DEA',
      'Adaptar la técnica a adultos, niños y neonatos',
    ],
    requisitos: ['Mayor de 16 años', 'Documento de identidad vigente', 'Ropa cómoda para práctica'],
    incluyeCertificado: true,
    normativa: ['AHA 2025', 'ERC', 'MinSalud'],
    tags: ['Adultos', 'Pediátrico', 'DEA', 'AHA · ERC'],
    icono: 'bi-heart-pulse',
    paraQuien: 'Profesionales de la salud, brigadistas, docentes, personal de seguridad y cualquier persona interesada en salvar vidas.',
    modulos: [
      { nombre: 'Fundamentos de RCP', temas: ['Cadena de supervivencia', 'Reconocimiento de PCR', 'Activación de SEM'], duracion: '2 horas' },
      { nombre: 'Técnicas de Compresión', temas: ['Posición correcta', 'Profundidad y frecuencia', 'Retroceso completo', 'Feedback con SIERCP'], duracion: '3 horas' },
      { nombre: 'Ventilación y DEA', temas: ['Apertura de vía aérea', 'Ventilación con BVM', 'Uso del DEA', 'Escenarios integrados'], duracion: '3 horas' },
    ],
    grupos: generarGruposCiclicos(new Date('2026-05-13')),
  },
  {
    slug: 'soporte-vital-basico',
    nombre: 'Soporte Vital Básico',
    descripcion: 'Integración de RCP, manejo de vía aérea y DEA. Ideal para personal de salud, educadores y brigadistas.',
    descripcionLarga: 'El curso de Soporte Vital Básico (SVB/BLS) es una formación integral que combina las técnicas de RCP con el manejo avanzado de la vía aérea y dispositivos de emergencia.',
    nivel: 'intermedio',
    modalidad: 'presencial',
    duracion: '12 horas',
    sesiones: 3,
    precioCOP: 200000,
    precioUSD: 53,
    objetivos: ['Dominar el protocolo BLS completo', 'Manejar obstrucción de vía aérea (OVACE)', 'Realizar RCP de alta calidad con feedback SIERCP', 'Trabajar en equipo de reanimación', 'Obtener certificación BLS Provider'],
    requisitos: ['Mayor de 18 años', 'Documento de identidad vigente', 'Recomendado: experiencia previa en RCP'],
    incluyeCertificado: true,
    normativa: ['AHA 2025', 'MinSalud'],
    tags: ['SVB', 'Cadena de supervivencia', 'BLS'],
    icono: 'bi-activity',
    paraQuien: 'Personal de salud, paramédicos, enfermeros, médicos en formación, brigadistas certificados.',
    modulos: [
      { nombre: 'Evaluación Primaria', temas: ['Escena segura', 'Evaluación rápida', 'Activación del SEM'], duracion: '2 horas' },
      { nombre: 'RCP de Alta Calidad', temas: ['Compresiones profesionales', 'Relación C:V', 'Trabajo en equipo'], duracion: '4 horas' },
      { nombre: 'Manejo de Vía Aérea', temas: ['Técnicas manuales', 'Dispositivos básicos', 'OVACE'], duracion: '3 horas' },
      { nombre: 'Escenarios Integrados', temas: ['Megacode', 'Evaluación práctica', 'Certificación'], duracion: '3 horas' },
    ],
    grupos: generarGruposCiclicos(new Date('2026-05-13')),
  },
  {
    slug: 'primeros-auxilios',
    nombre: 'Primeros Auxilios',
    descripcion: 'Atención inicial ante hemorragias, fracturas, quemaduras, intoxicaciones, obstrucción de vía aérea y más.',
    descripcionLarga: 'Formación completa en primeros auxilios para emergencias frecuentes en entornos laborales, educativos y domésticos.',
    nivel: 'basico',
    modalidad: 'presencial',
    duracion: '8 horas',
    sesiones: 2,
    precioCOP: 100000,
    precioUSD: 26,
    objetivos: ['Evaluar la escena y la víctima correctamente', 'Controlar hemorragias y aplicar torniquetes', 'Inmovilizar fracturas y luxaciones', 'Manejar quemaduras de primer y segundo grado', 'Atender intoxicaciones y reacciones alérgicas'],
    requisitos: ['Mayor de 16 años', 'Documento de identidad vigente'],
    incluyeCertificado: true,
    normativa: ['MinSalud', 'Cruz Roja'],
    tags: ['Básico', 'Avanzado', 'In-company'],
    icono: 'bi-bandaid',
    paraQuien: 'Público general, trabajadores, docentes, padres de familia.',
    modulos: [
      { nombre: 'Evaluación de la Emergencia', temas: ['Escena segura', 'Evaluación primaria', 'Llamada al SEM'], duracion: '2 horas' },
      { nombre: 'Hemorragias y Heridas', temas: ['Control de hemorragias', 'Torniquete', 'Vendaje compresivo'], duracion: '2 horas' },
      { nombre: 'Trauma y Quemaduras', temas: ['Fracturas', 'Inmovilización', 'Quemaduras', 'Intoxicaciones'], duracion: '4 horas' },
    ],
    grupos: generarGruposCiclicos(new Date('2026-05-13')),
  },
  {
    slug: 'seguridad-salvamento-piscina',
    nombre: 'Seguridad y Salvamento en Piscina',
    descripcion: 'Formación de salvavidas y socorristas acuáticos con técnicas de rescate y prevención de ahogamientos.',
    descripcionLarga: 'Programa certificado de formación de socorristas acuáticos con práctica en piscina real.',
    nivel: 'avanzado',
    modalidad: 'presencial',
    duracion: '40 horas',
    sesiones: 10,
    precioCOP: 300000,
    precioUSD: 80,
    objetivos: ['Dominar técnicas de rescate acuático', 'Prevenir ahogamientos', 'Aplicar primeros auxilios acuáticos', 'Gestionar emergencias en instalaciones acuáticas'],
    requisitos: ['Mayor de 18 años', 'Saber nadar (mínimo 200m sin parar)', 'Certificado médico de aptitud'],
    incluyeCertificado: true,
    normativa: ['MinSalud', 'Resolución 0256'],
    tags: ['Salvavidas', 'Rescate acuático', 'Certificación'],
    icono: 'bi-life-preserver',
    paraQuien: 'Aspirantes a salvavidas, personal de piscinas, clubes deportivos.',
    modulos: [
      { nombre: 'Seguridad Acuática', temas: ['Prevención', 'Normativa', 'Protocolos de piscina'], duracion: '8 horas' },
      { nombre: 'Técnicas de Rescate', temas: ['Rescate sin contacto', 'Rescate con contacto', 'Rescate con equipo'], duracion: '16 horas' },
      { nombre: 'Primeros Auxilios Acuáticos', temas: ['Ahogamiento', 'Hipotermia', 'Lesiones cervicales'], duracion: '8 horas' },
      { nombre: 'Gestión de Emergencias', temas: ['Plan de emergencia', 'Comunicación', 'Evacuación'], duracion: '8 horas' },
    ],
    grupos: generarGruposCiclicos(new Date('2026-05-13')),
  },
  {
    slug: 'natacion-personalizada',
    nombre: 'Natación Personalizada',
    descripcion: 'Clases individuales y grupales adaptadas a todos los niveles, enfocadas en técnica y seguridad acuática.',
    descripcionLarga: 'Programa de natación adaptado a las necesidades individuales del estudiante.',
    nivel: 'basico',
    modalidad: 'presencial',
    duracion: '1 mes',
    sesiones: 6,
    precioCOP: 150000,
    precioUSD: 40,
    objetivos: ['Familiarizarse con el medio acuático', 'Aprender los 4 estilos de natación', 'Mejorar la técnica de respiración', 'Desarrollar resistencia y confianza en el agua'],
    requisitos: ['No se requiere experiencia previa', 'Traje de baño y gafas de natación'],
    incluyeCertificado: true,
    normativa: [],
    tags: ['Todos los niveles', 'Individual', 'Grupal'],
    icono: 'bi-water',
    paraQuien: 'Niños, jóvenes y adultos de cualquier nivel.',
    modulos: [
      { nombre: 'Familiarización', temas: ['Flotación', 'Respiración', 'Desplazamiento básico'], duracion: '4 horas' },
      { nombre: 'Estilos', temas: ['Crol', 'Espalda', 'Pecho', 'Mariposa'], duracion: '6 horas' },
      { nombre: 'Perfeccionamiento', temas: ['Técnica avanzada', 'Resistencia', 'Evaluación final'], duracion: '2 horas' },
    ],
    grupos: generarGruposCiclicos(new Date('2026-05-13')),
  },
  {
    slug: 'manejo-de-extintor',
    nombre: 'Manejo de Extintor',
    descripcion: 'Identificación de tipos de fuego, clasificación de extintores y técnica práctica de extinción segura.',
    descripcionLarga: 'Capacitación práctica en el manejo correcto de extintores portátiles.',
    nivel: 'basico',
    modalidad: 'presencial',
    duracion: '4 horas',
    sesiones: 1,
    precioCOP: 80000,
    precioUSD: 21,
    objetivos: ['Identificar los tipos de fuego', 'Seleccionar el extintor correcto', 'Aplicar la técnica PASS', 'Conocer las normas de seguridad contra incendios'],
    requisitos: ['Mayor de 16 años', 'Ropa cómoda para práctica exterior'],
    incluyeCertificado: true,
    normativa: ['NFPA', 'MinTrabajo'],
    tags: ['PASS', 'Clases A·B·C', 'Práctica real'],
    icono: 'bi-fire',
    paraQuien: 'Brigadistas, personal de seguridad, trabajadores en general.',
    modulos: [
      { nombre: 'Teoría del Fuego', temas: ['Triángulo del fuego', 'Tipos de fuego', 'Clasificación de extintores'], duracion: '1.5 horas' },
      { nombre: 'Práctica Real', temas: ['Técnica PASS', 'Simulacro con fuego real', 'Evaluación'], duracion: '2.5 horas' },
    ],
    grupos: generarGruposCiclicos(new Date('2026-05-13')),
  },
];

export function getCursoBySlug(slug: string): Curso | undefined {
  return cursos.find(c => c.slug === slug);
}

export function getGrupoAbierto(curso: Curso): Grupo | undefined {
  return curso.grupos.find(g => g.estado === 'abierto');
}

export function getGruposActivos(curso: Curso): Grupo[] {
  return curso.grupos.filter(g => g.estado === 'abierto' || g.estado === 'proximo');
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
