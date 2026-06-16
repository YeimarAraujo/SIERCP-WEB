export interface TimelineItem {
  year: string;
  title: string;
  desc: string;
}

export interface TeamMember {
  name: string;
  role: string;
  certs: string[];
  bio: string;
  initials: string;
  color: string;
}

export interface Alliance {
  name: string;
  abbr: string;
  type: string;
}

export interface Value {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

export interface Stat {
  big: string;
  suffix: string;
  label: string;
  icon: string;
}

export interface Feature {
  icon: string;
  title: string;
  desc: string;
}

export const stats: Stat[] = [
  { big: "4", suffix: "+", label: "Empresas aliadas", icon: "bi-building" },
  { big: "5", suffix: "+", label: "Instituciones con SIERCP", icon: "bi-cpu" },
  { big: "98", suffix: "%", label: "Tasa de satisfacción", icon: "bi-star-fill" },
];

export const timeline: TimelineItem[] = [
  {
    year: "2024",
    title: "Fundación",
    desc: "Jomar Segurid nace en Valledupar como academia de primeros auxilios y salvamento acuático, con 3 instructores y 40 estudiantes en el primer año.",
  },
  {
    year: "2025",
    title: "Expansión regional",
    desc: "Apertura de alianzas en Barranquilla, Bogotá y Medellín. Certificación como Centro Avalado por la Cruz Roja Colombiana y formación de más de 200 instructores regionales.",
  },
  {
    year: "2026",
    title: "Certificación AHA",
    desc: "Jomar Segurid se convierte en Training Center de la American Heart Association (AHA), adoptando los protocolos más exigentes del mundo en RCP y soporte vital.",
  },
  {
    year: "2026",
    title: "Innovación digital",
    desc: "Inicio del desarrollo de SIERCP, el primer sistema IoT colombiano para el monitoreo en tiempo real de sesiones de RCP con maniquíes inteligentes y análisis de datos.",
  },
  {
    year: "2026",
    title: "Lanzamiento SIERCP v1",
    desc: "Lanzamiento oficial de la plataforma SIERCP-IoT v.1, integrando hardware, software y certificación digital. Jomar Segurid Se Convierte en la 1era Empresa Colombiana Certificada en la Fabricación de Equipos Médicos para Soporte Vital Avanzado con Software IoT, Desarrollado y Fabricado 100% en Colombia, Integrando Inteligencia Artificial para la Formación en Reanimación Cardiopulmonar."
  }
];

export const values: Value[] = [
  {
    icon: "bi-heart-pulse-fill",
    title: "Excelencia Clínica",
    desc: "Cada programa, protocolo y herramienta que entregamos está respaldada en evidencia científica y validada por organismos internacionales.",
    color: "#ef4444",
  },
  {
    icon: "bi-lightbulb-fill",
    title: "Innovación Constante",
    desc: "Somos el único centro en Colombia que integra IoT, inteligencia artificial y simulación avanzada en la enseñanza de emergencias.",
    color: "#f59e0b",
  },
  {
    icon: "bi-people-fill",
    title: "Impacto Humano",
    desc: "No vendemos cursos, transformamos personas. Cada estudiante que formamos puede salvar una vida el día de mañana.",
    color: "#1800ad",
  },
  {
    icon: "bi-shield-fill-check",
    title: "Integridad",
    desc: "Operamos con total transparencia institucional, cumpliendo rigurosamente los estándares éticos y legales de cada organismo certificador.",
    color: "#10b981",
  },
  {
    icon: "bi-graph-up-arrow",
    title: "Mejora Continua",
    desc: "Actualizamos nuestros currículos cada vez que la AHA o la OMS publican nuevas guías. Nunca enseñamos con protocolos obsoletos.",
    color: "#6d4aff",
  },
  {
    icon: "bi-globe-americas",
    title: "Visión Global",
    desc: "Con estándares internacionales y tecnología propia, llevamos la formación colombiana en emergencias al nivel más exigente del mundo.",
    color: "#0ea5e9",
  },
];

export const team: TeamMember[] = [

  {
    name: "Ing. Yeimar Araujo",
    role: "CTO – Plataforma SIERCP",
    certs: ["IoT Certified Developer", "AWS Solutions Architect", "Scrum Master"],
    bio: "Ingeniero de Sistemas especializado en IoT médico. Diseñó la arquitectura de hardware y software de SIERCP desde cero.",
    initials: "YA",
    color: "#1800ad",
  },
  {
    name: "Ing. Jose Macea",
    role: "Desarrollador Flutter – Apps Móviles",
    certs: ["Flutter Developer", "Mobile UI/UX", "Arquitectura de Apps Móviles"],
    bio: "Ingeniero encargado del desarrollo de componentes de la aplicación móvil en Flutter, enfocado en rendimiento y experiencia de usuario.",
    initials: "JM",
    color: "#1800ad",
  },
  {
    name: "Ing. Kevin Noriega",
    role: "Desarrollador Flutter – Apps Móviles",
    certs: ["Flutter Specialist", "State Management", "Cross-Platform Development"],
    bio: "Ingeniero responsable de la implementación de módulos móviles en Flutter y optimización de la app multiplataforma.",
    initials: "KN",
    color: "#1800ad",
  },
  {
    name: "Ing. Daniel Turizo",
    role: "Desarrollador Web – Aplicación Plataforma",
    certs: ["Frontend Developer", "React/Next.js", "Arquitectura Web"],
    bio: "Ingeniero encargado del desarrollo de la aplicación web, asegurando escalabilidad, rendimiento y buenas prácticas de frontend.",
    initials: "DT",
    color: "#1800ad",
  },
];

export const alliances: Alliance[] = [
  { name: "American Heart Association", abbr: "AHA", type: "Aval Internacional" },
  { name: "Cruz Roja Colombiana", abbr: "CRC", type: "Certificación Nacional" },
  { name: "SENA", abbr: "SENA", type: "Convenio Formativo" },
  { name: "Ministerio de Salud", abbr: "MinSalud", type: "Reconocimiento Oficial" },
  { name: "Clínica Valledupar", abbr: "CV", type: "Aliado Clínico" },
  { name: "Empresas Públicas", abbr: "EPM", type: "Cliente Corporativo" },
  { name: "Universidad Popular", abbr: "UPC", type: "Convenio Académico" },
  { name: "Bomberos de Colombia", abbr: "BC", type: "Formación Especializada" },
];

export const missionCards = [
  {
    icon: "bi-compass-fill",
    label: "Misión",
    color: "#1800ad",
    text: "Formar personas competentes en primeros auxilios, emergencias médicas y reanimación cardiopulmonar, utilizando metodologías basadas en evidencia científica y tecnología de punta, con el fin de aumentar la tasa de supervivencia ante situaciones de emergencia en Colombia y Latinoamérica.",
  },
  {
    icon: "bi-eye-fill",
    label: "Visión",
    color: "#6d4aff",
    text: "Ser el centro de formación en emergencias más innovador y reconocido de Latinoamérica al 2030, integrando tecnología IoT, inteligencia artificial y estándares internacionales AHA para transformar la cultura de respuesta ante emergencias en la región.",
  },
  {
    icon: "bi-gem",
    label: "Propuesta de Valor",
    color: "#10b981",
    text: "La única academia en Colombia que certifica en estándares AHA y otorga certificados digitales verificables en blockchain, con seguimiento IoT en tiempo real de la calidad de cada maniobra de RCP realizada por sus estudiantes.",
  },
];