
export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  name: string;
  desc: string;
  monthlyCOP: number;
  isContact?: boolean;
  isOneTime?: boolean;
  highlight: boolean;
  badge: string | null;
  maniquiesIncluidos?: number;
  features: PlanFeature[];
}

export interface ManiquiPackage {
  name: string;
  desc: string;
  quantity: number | null;
  unitPriceCOP: number;
  totalPriceCOP: number | null;
  discountPercent: number;
  badge: string | null;
  highlight: boolean;
  includes: string[];
}

export interface Comparison {
  feature: string;
  pyme: string;
  business: string;
  corporate: string;
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

// ── PAQUETES DE COMPRA DE MANIQUÍES (pago único — hardware IoT) ──────────
// NOTA: Precios propuestos. Confirmar con el equipo antes de publicar.
export const maniquiPackages: ManiquiPackage[] = [
  {
    name: "Unidad",
    desc: "Ideal para centros de formación que inician con simulación inteligente",
    quantity: 1,
    unitPriceCOP: 1950000,
    totalPriceCOP: 1950000,
    discountPercent: 0,
    badge: null,
    highlight: false,
    includes: [
      "1 maniquí SIERCP con sensores IoT",
      "Conectividad BLE 5.2 con la app",
      "App móvil SIERCP (iOS y Android)",
      "Dashboard básico de sesiones",
      "1 año de garantía de hardware",
      "Actualizaciones de firmware incluidas",
      "Soporte técnico por email",
    ],
  },
  {
    name: "Pack 4",
    desc: "La opción más popular para instituciones y centros de formación SST",
    quantity: 4,
    unitPriceCOP: 1657500,
    totalPriceCOP: 6630000,
    discountPercent: 15,
    badge: "Más popular",
    highlight: true,
    includes: [
      "4 maniquíes SIERCP con sensores IoT",
      "Conectividad BLE 5.2 con la app",
      "App móvil SIERCP (iOS y Android)",
      "Dashboard avanzado multi-dispositivo",
      "1 año de garantía de hardware",
      "Monitoreo en vivo del instructor",
      "Soporte prioritario < 8h",
      "Configuración remota incluida",
    ],
  },
  {
    name: "Pack 8",
    desc: "Para hospitales, universidades y centros de simulación avanzada",
    quantity: 8,
    unitPriceCOP: 1462500,
    totalPriceCOP: 11700000,
    discountPercent: 25,
    badge: "Mayor ahorro",
    highlight: false,
    includes: [
      "8 maniquíes SIERCP con sensores IoT",
      "Conectividad BLE 5.2 con la app",
      "App móvil SIERCP (iOS y Android)",
      "Dashboard multi-sede centralizado",
      "2 años de garantía de hardware",
      "Monitoreo en vivo del instructor",
      "Soporte prioritario < 4h",
      "Instalación y configuración presencial",
      "Capacitación del equipo incluida",
    ],
  },
  {
    name: "Pack 12+",
    desc: "Grandes organizaciones con múltiples sedes y alta demanda de formación",
    quantity: null,
    unitPriceCOP: 0,
    totalPriceCOP: null,
    discountPercent: 30,
    badge: "Empresarial",
    highlight: false,
    includes: [
      "12 o más maniquíes SIERCP personalizados",
      "Garantía extendida hasta 3 años",
      "Instalación presencial en todas las sedes",
      "Capacitación completa del equipo",
      "Soporte dedicado 24/7",
      "Integración con sistemas existentes",
      "SLA garantizado y contrato de servicio",
      "Más del 30% de descuento sobre precio unitario",
    ],
  },
];

// ── PLANES CORPORATIVOS (suscripción + maniquíes incluidos) ──────────────
export const corporatePlans: Plan[] = [
  {
    name: "PYME",
    desc: "Empresas, clínicas y centros en crecimiento",
    monthlyCOP: 380000,
    highlight: false,
    badge: null,
    maniquiesIncluidos: 1,
    features: [
      { text: "1 maniquí SIERCP incluido", included: true },
      { text: "Hasta 15 usuarios", included: true },
      { text: "1 sede", included: true },
      { text: "3 cursos activos", included: true },
      { text: "50 certificados/mes", included: true },
      { text: "Historial 6 meses", included: true },
      { text: "Reportes PDF básicos", included: true },
      { text: "Chat grupal por curso", included: true },
      { text: "Calendario de entregas", included: true },
      { text: "Sesiones en vivo", included: false },
      { text: "Dashboard multi-sede", included: false },
      { text: "API de integración", included: false },
    ],
  },
  {
    name: "Business",
    desc: "La opción ideal para centros de formación SST",
    monthlyCOP: 790000,
    highlight: true,
    badge: "Más popular",
    maniquiesIncluidos: 2,
    features: [
      { text: "2 maniquíes SIERCP incluidos", included: true },
      { text: "Hasta 50 usuarios", included: true },
      { text: "Hasta 2 sedes", included: true },
      { text: "10 cursos activos", included: true },
      { text: "200 certificados/mes", included: true },
      { text: "Historial 2 años", included: true },
      { text: "Reportes PDF + Excel + CSV", included: true },
      { text: "Chat grupal por curso", included: true },
      { text: "Calendario de entregas", included: true },
      { text: "Sesiones en vivo", included: true },
      { text: "Dashboard multi-sede", included: false },
      { text: "API de integración", included: false },
    ],
  },
  {
    name: "Corporate",
    desc: "Hospitales e instituciones con múltiples sedes",
    monthlyCOP: 1580000,
    highlight: false,
    badge: "Multi-sede",
    maniquiesIncluidos: 4,
    features: [
      { text: "4 maniquíes SIERCP incluidos", included: true },
      { text: "Hasta 200 usuarios", included: true },
      { text: "Hasta 5 sedes", included: true },
      { text: "Cursos ilimitados", included: true },
      { text: "Certificados ilimitados", included: true },
      { text: "Historial ilimitado", included: true },
      { text: "Reportes personalizados + BI", included: true },
      { text: "Chat grupal por curso", included: true },
      { text: "Calendario de entregas", included: true },
      { text: "Sesiones en vivo + grabación", included: true },
      { text: "Dashboard multi-sede", included: true },
      { text: "API básica de integración", included: true },
    ],
  },
  {
    name: "Enterprise",
    desc: "Grandes organizaciones — precio a medida",
    monthlyCOP: 0,
    isContact: true,
    highlight: false,
    badge: "Personalizable",
    maniquiesIncluidos: 0,
    features: [
      { text: "Maniquíes a medida (cotización)", included: true },
      { text: "Usuarios ilimitados", included: true },
      { text: "Sedes ilimitadas", included: true },
      { text: "Todo lo de Corporate incluido", included: true },
      { text: "White-label y branding propio", included: true },
      { text: "API completa + webhooks", included: true },
      { text: "SSO / SAML", included: true },
      { text: "Auditorías y logs completos", included: true },
      { text: "Análisis con IA predictiva", included: true },
      { text: "Onboarding presencial incluido", included: true },
      { text: "Soporte dedicado 24/7", included: true },
      { text: "SLA garantizado por contrato", included: true },
    ],
  },
];

// ── SST CON LICENCIA (suscripción mensual) ───────────────────────────────
export const sstConLicenciaPlans: Plan[] = [
  {
    name: "SST Básico",
    desc: "Para profesionales SST que inician la digitalización",
    monthlyCOP: 150000,
    highlight: false,
    badge: null,
    features: [
      { text: "30 certificados/mes", included: true },
      { text: "2 plantillas básicas de certificado", included: true },
      { text: "QR de validación en cada certificado", included: true },
      { text: "Exportación PDF", included: true },
      { text: "Historial 6 meses", included: true },
      { text: "Marca de agua SIERCP", included: true },
      { text: "Logo propio en certificados", included: false },
      { text: "Firma digital", included: false },
      { text: "Certificados masivos (CSV)", included: false },
      { text: "Plantillas personalizadas", included: false },
    ],
  },
  {
    name: "SST Pro",
    desc: "La herramienta preferida de los profesionales SST",
    monthlyCOP: 320000,
    highlight: true,
    badge: "Más elegido",
    features: [
      { text: "100 certificados/mes", included: true },
      { text: "5 plantillas + personalizables", included: true },
      { text: "QR de validación en cada certificado", included: true },
      { text: "Exportación PDF", included: true },
      { text: "Historial 2 años", included: true },
      { text: "Sin marca de agua", included: true },
      { text: "Logo propio en certificados", included: true },
      { text: "Firma digital escaneada", included: true },
      { text: "Certificados masivos (CSV)", included: false },
      { text: "Plantillas personalizadas ilimitadas", included: false },
    ],
  },
  {
    name: "SST Expert",
    desc: "Para consultoras y equipos SST de alto volumen",
    monthlyCOP: 580000,
    highlight: false,
    badge: null,
    features: [
      { text: "Certificados ilimitados", included: true },
      { text: "Plantillas ilimitadas + personalizadas", included: true },
      { text: "QR de validación en cada certificado", included: true },
      { text: "Exportación PDF", included: true },
      { text: "Historial ilimitado", included: true },
      { text: "Sin marca de agua", included: true },
      { text: "Logo + sello propio", included: true },
      { text: "Firma digital", included: true },
      { text: "Certificados masivos (CSV)", included: true },
      { text: "Hasta 3 usuarios del equipo", included: true },
    ],
  },
];

// ── SST SIN LICENCIA — PAQUETES DE CRÉDITOS (pago único por certificado) ─
export const sstSinLicenciaPlans: Plan[] = [
  {
    name: "Pack 5",
    desc: "Para explorar la plataforma y generar tus primeros certificados",
    monthlyCOP: 45000,
    isOneTime: true,
    highlight: false,
    badge: null,
    features: [
      { text: "5 certificados", included: true },
      { text: "1 plantilla básica incluida", included: true },
      { text: "QR de validación", included: true },
      { text: "Exportación PDF", included: true },
      { text: "Marca de agua SIERCP", included: true },
      { text: "Logo propio en certificado", included: false },
      { text: "Sin marca de agua", included: false },
      { text: "Certificados masivos", included: false },
    ],
  },
  {
    name: "Pack 15",
    desc: "El balance ideal entre precio y volumen para profesionales",
    monthlyCOP: 120000,
    isOneTime: true,
    highlight: true,
    badge: "Más elegido",
    features: [
      { text: "15 certificados", included: true },
      { text: "1 plantilla básica incluida", included: true },
      { text: "QR de validación", included: true },
      { text: "Exportación PDF", included: true },
      { text: "Marca de agua SIERCP", included: true },
      { text: "Logo propio en certificado", included: false },
      { text: "Sin marca de agua", included: false },
      { text: "Certificados masivos", included: false },
    ],
  },
  {
    name: "Pack 40",
    desc: "Para profesionales con alta frecuencia de certificación",
    monthlyCOP: 280000,
    isOneTime: true,
    highlight: false,
    badge: "Mayor ahorro",
    features: [
      { text: "40 certificados", included: true },
      { text: "2 plantillas incluidas", included: true },
      { text: "QR de validación", included: true },
      { text: "Exportación PDF", included: true },
      { text: "Marca de agua SIERCP", included: true },
      { text: "Logo propio en certificado", included: false },
      { text: "Sin marca de agua", included: false },
      { text: "Certificados masivos", included: false },
    ],
  },
];

// ── Alias para compatibilidad (el plan principal = corporativo) ───────────
export const plans = corporatePlans;

// ── TABLA COMPARATIVA — PLANES CORPORATIVOS ──────────────────────────────
export const comparisons: Comparison[] = [
  { feature: "Maniquíes incluidos",   pyme: "1",       business: "2",          corporate: "4",              enterprise: "A medida" },
  { feature: "Usuarios",              pyme: "15",      business: "50",         corporate: "200",             enterprise: "Ilimitados" },
  { feature: "Sedes",                 pyme: "1",       business: "2",          corporate: "5",              enterprise: "Ilimitadas" },
  { feature: "Cursos activos",        pyme: "3",       business: "10",         corporate: "Ilimitados",     enterprise: "Ilimitados" },
  { feature: "Certificados/mes",      pyme: "50",      business: "200",        corporate: "Ilimitados",     enterprise: "Ilimitados" },
  { feature: "Historial sesiones",    pyme: "6 meses", business: "2 años",     corporate: "Ilimitado",      enterprise: "Ilimitado" },
  { feature: "Reportes",              pyme: "PDF",     business: "PDF+Excel",  corporate: "Personalizados", enterprise: "BI Completo" },
  { feature: "Sesiones en vivo",      pyme: "—",       business: "✓",          corporate: "✓ + grabación",  enterprise: "✓ + grabación" },
  { feature: "Chat grupal cursos",    pyme: "✓",       business: "✓",          corporate: "✓",              enterprise: "✓" },
  { feature: "Calendario entregas",   pyme: "✓",       business: "✓",          corporate: "✓",              enterprise: "✓" },
  { feature: "API",                   pyme: "—",       business: "—",          corporate: "Básica",         enterprise: "Completa + webhooks" },
  { feature: "White-label",           pyme: "—",       business: "—",          corporate: "—",              enterprise: "✓" },
  { feature: "SSO / SAML",            pyme: "—",       business: "—",          corporate: "—",              enterprise: "✓" },
  { feature: "Soporte",               pyme: "Email",   business: "< 8h",       corporate: "< 2h",           enterprise: "Dedicado 24/7" },
];

// ── FAQs ─────────────────────────────────────────────────────────────────
export const faqs: FAQ[] = [
  {
    q: "¿Los maniquíes incluidos en el plan vienen listos para usar?",
    a: "Sí. Los maniquíes de los planes PYME y Business vienen preconfigurados con configuración remota guiada. En el plan Corporate incluimos instalación presencial y capacitación del equipo.",
  },
  {
    q: "¿Puedo adquirir maniquíes adicionales a mi suscripción?",
    a: "Sí. Puedes añadir maniquíes adicionales por $25.000 COP/mes cada uno, o adquirirlos independientemente con nuestros paquetes de compra de hardware con descuentos por volumen.",
  },
  {
    q: "¿Qué diferencia hay entre comprar maniquíes y suscribirse a un plan?",
    a: "La compra de maniquíes es un pago único de hardware. Los planes de suscripción incluyen el software, la plataforma de gestión, los certificados, reportes y soporte mensual. Los planes corporativos combinan ambos: incluyen maniquíes + software en una sola suscripción.",
  },
  {
    q: "¿Qué diferencia hay entre un usuario con y sin licencia SST?",
    a: "Un profesional con licencia SST vigente puede emitir certificados de forma autónoma con su sello y firma oficial. Un usuario sin licencia SST puede generar certificados comprando paquetes de créditos, con marca de agua SIERCP y restricciones regulatorias adicionales.",
  },
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. El upgrade es inmediato con cobro proporcional. El downgrade aplica al inicio del siguiente período. Ofrecemos garantía de 30 días con reembolso completo para nuevas suscripciones.",
  },
  {
    q: "¿Ofrecen descuentos para ONGs o instituciones educativas públicas?",
    a: "Sí. Tenemos descuentos del 20%–40% para instituciones educativas públicas, ONGs y entidades sin ánimo de lucro. Escríbenos a info@jomarsegurid.co con documentación de respaldo.",
  },
];

// ── TESTIMONIOS ───────────────────────────────────────────────────────────
export const testimonials: Testimonial[] = [
  {
    name: "Dr. Alejandro Suárez",
    role: "Director Médico, Clínica San José",
    plan: "Corporate",
    text: "SIERCP transformó la forma en que evaluamos a nuestros residentes. Ahora tenemos datos objetivos de cada maniobra y los certificados son verificables en segundos.",
  },
  {
    name: "Lic. Patricia Gómez",
    role: "Coordinadora SST, SENA Valledupar",
    plan: "Business",
    text: "El dashboard en tiempo real nos permite detectar al instante cuáles estudiantes necesitan más práctica. La tasa de aprobación subió del 72% al 94%.",
  },
  {
    name: "Ing. Roberto Mesa",
    role: "HSE Manager, Cerrejón",
    plan: "Corporate",
    text: "La integración con nuestro sistema de competencias fue sencilla y el soporte dedicado fue clave durante la implementación en 3 sedes simultáneas.",
  },
];
