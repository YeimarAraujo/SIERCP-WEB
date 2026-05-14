
export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  name: string;
  desc: string;
  monthlyCOP: number;
  highlight: boolean;
  badge: string | null;
  features: PlanFeature[];
}

export interface Comparison {
  feature: string;
  starter: string;
  pro: string;
  enterprise: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface Testimonial {
  name: string;
  role: string;
  plan: string;
  text: string;
}


export const plans: Plan[] = [
  {
    name: "Starter",
    desc: "Para instituciones que inician con simulación",
    monthlyCOP: 200000,
    highlight: false,
    badge: null,
    features: [
      { text: "Incluye 1 maniquí gratis",      included: true  },
      { text: "Dashboard básico de sesiones",       included: true  },
      { text: "Historial de sesiones (90 días)",    included: true  },
      { text: "Reportes PDF automáticos",           included: true  },
      { text: "Certificados digitales básicos",     included: true  },
      { text: "Soporte por email (< 24h)",          included: true  },
      { text: "Actualizaciones automáticas",        included: true  },
      { text: "Sesiones en vivo / tiempo real",     included: false },
      { text: "Ranking de estudiantes",             included: false },
      { text: "API de integración",                 included: false },
      { text: "Análisis con IA",                    included: false },
      { text: "Soporte prioritario",                included: false },
    ],
  },
  {
    name: "Profesional",
    desc: "La opción más popular para centros de formación",
    monthlyCOP: 300000,
    highlight: true,
    badge: "Más popular",
    features: [
      { text: "Incluye 2 maniquíes gratis",      included: true  },
      { text: "Dashboard avanzado multi-usuario",   included: true  },
      { text: "Historial ilimitado de sesiones",    included: true  },
      { text: "Reportes PDF + CSV + Excel",         included: true  },
      { text: "Certificados digitales con QR",      included: true  },
      { text: "Soporte prioritario (< 4h)",         included: true  },
      { text: "Actualizaciones automáticas",        included: true  },
      { text: "Sesiones en vivo / tiempo real",     included: true  },
      { text: "Ranking de estudiantes",             included: true  },
      { text: "API de integración básica",          included: true  },
      { text: "Análisis con IA",                    included: false },
      { text: "Soporte dedicado 24/7",              included: false },
    ],
  },
  {
    name: "Enterprise",
    desc: "Para grandes organizaciones con necesidades avanzadas",
    monthlyCOP: 800000,
    highlight: false,
    badge: "Personalizable",
    features: [
      { text: "Incluye 4 maniquíes gratis",                       included: true },
      { text: "Dashboard multi-sede centralizado",          included: true },
      { text: "Historial ilimitado + backups",              included: true },
      { text: "Reportes personalizados + BI",               included: true },
      { text: "Certificados personalizados + blockchain",   included: true },
      { text: "Soporte dedicado 24/7 (< 1h)",              included: true },
      { text: "Actualizaciones automáticas",                included: true },
      { text: "Sesiones en vivo + grabación",               included: true },
      { text: "Ranking + gamificación avanzada",            included: true },
      { text: "API completa + webhooks + SSO",              included: true },
      { text: "Análisis con IA predictivo",                 included: true },
      { text: "Onboarding personalizado incluido",          included: true },
    ],
  },
];


export const comparisons: Comparison[] = [
  { feature: "Historial de sesiones", starter: "90 días",         pro: "Ilimitado",         enterprise: "Ilimitado + backup"   },
  { feature: "Certificados digitales",starter: "Básicos",         pro: "QR verificable",    enterprise: "Blockchain + custom"  },
  { feature: "Soporte técnico",       starter: "Email < 24h",     pro: "Prioritario < 4h",  enterprise: "Dedicado < 1h"        },
  { feature: "Sesiones en vivo",      starter: "—",               pro: "✓",                 enterprise: "✓ + grabación"        },
  { feature: "API de integración",    starter: "—",               pro: "Básica",            enterprise: "Completa + webhooks"  },
  { feature: "Análisis con IA",       starter: "—",               pro: "—",                 enterprise: "✓ Predictivo"         },
  { feature: "Multi-sede",            starter: "—",               pro: "—",                 enterprise: "✓"                    },
  { feature: "SSO / SAML",            starter: "—",               pro: "—",                 enterprise: "✓"                    },
  { feature: "Onboarding",            starter: "Documentación",   pro: "Videollamada inicial", enterprise: "Presencial incluido" },
];


export const faqs: FAQ[] = [
  {
    q: "¿El precio incluye el hardware (sensores IoT)?",
    a: "No. La suscripción cubre únicamente el software (plataforma, dashboard, certificados, soporte). Los sensores IoT y la instalación se cotizan por separado según el número y modelo de maniquíes. Contáctanos para una cotización integral hardware + software.",
  },
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Puedes hacer upgrade en cualquier momento con cobro proporcional. El downgrade aplica al inicio del siguiente período anual. Tenemos garantía de 30 días con reembolso completo.",
  },
  {
    q: "¿Qué pasa si supero el límite de maniquíes?",
    a: "En los planes Starter y Profesional, si necesitas conectar más maniquíes de los incluidos, puedes agregar bloques adicionales por un costo mensual extra, o hacer upgrade al plan superior. Nunca dejamos de funcionar abruptamente.",
  },
  {
    q: "¿Ofrecen descuento para ONGs o instituciones educativas públicas?",
    a: "Sí. Tenemos descuentos especiales del 20%–40% para instituciones educativas públicas, ONGs y entidades sin ánimo de lucro. Escríbenos a info@jomarsegurid.co con documentación de respaldo y evaluamos tu caso.",
  },
];


export const testimonials: Testimonial[] = [
  {
    name: "Dr. Alejandro Suárez",
    role: "Director Médico, Clínica San José",
    plan: "Enterprise",
    text: "SIERCP transformó la forma en que evaluamos a nuestros residentes. Ahora tenemos datos objetivos de cada maniobra y los certificados son verificables en segundos.",
  },
  {
    name: "Lic. Patricia Gómez",
    role: "Coordinadora, SENA Valledupar",
    plan: "Profesional",
    text: "El dashboard en tiempo real nos permite detectar al instante cuáles estudiantes necesitan más práctica. La tasa de aprobación subió del 72% al 94%.",
  },
  {
    name: "Ing. Roberto Mesa",
    role: "HSE Manager, Cerrejón",
    plan: "Enterprise",
    text: "La integración API con nuestro sistema de gestión de competencias fue sencilla y el soporte dedicado fue clave durante la implementación en 3 sedes simultáneas.",
  },
];