export interface FaqCategory {
  id: string;
  label: string;
  icon: string;
}

export interface FaqItem {
  cat: string;
  q: string;
  a: string;
}

export interface HelpTopic {
  icon: string;
  title: string;
  desc: string;
  href: string;
}

export const categories: FaqCategory[] = [
  { id: "all", label: "Todas", icon: "bi-grid-3x3-gap" },
  { id: "siercp", label: "Software SIERCP", icon: "bi-cpu" },
  { id: "cursos", label: "Cursos & Certificación", icon: "bi-journal-check" },
  { id: "planes", label: "Planes & Precios", icon: "bi-credit-card" },
  { id: "soporte", label: "Soporte Técnico", icon: "bi-headset" },
  { id: "aha", label: "Estándares AHA", icon: "bi-heart-pulse" },
];

export const faqs: FaqItem[] = [
  {
    cat: "siercp",
    q: "¿Qué es SIERCP exactamente?",
    a: "SIERCP (Sistema Integrado de Evaluación y Registro de Calidad en RCP) es una plataforma colombiana que combina hardware IoT y software en la nube para monitorear en tiempo real la calidad de las maniobras de reanimación cardiopulmonar. Los sensores instalados en los maniquíes miden profundidad de compresión, frecuencia, posición de manos y ventilación, enviando los datos a una plataforma donde instructores y estudiantes pueden ver métricas detalladas y generar certificados digitales verificables.",
  },
  {
    cat: "siercp",
    q: "¿Necesito comprar maniquíes nuevos para usar SIERCP?",
    a: "Depende del modelo de maniquí que tengas. Nuestros sensores SIERCP son compatibles con los maniquíes más comunes del mercado (Laerdal, Prestan, Brayden). Si ya tienes maniquíes de estas marcas, solo necesitas el kit de sensores IoT. Si no, también ofrecemos maniquíes de alta fidelidad con SIERCP ya integrado desde fábrica. En todos los casos, uno de nuestros técnicos realiza la instalación y configuración sin costo adicional.",
  },
  {
    cat: "siercp",
    q: "¿Puedo usar SIERCP sin conexión a internet?",
    a: "Sí. Nuestra aplicación móvil funciona en modo offline usando Bluetooth para conectarse directamente con los maniquíes. Los datos de la sesión se almacenan localmente y se sincronizan automáticamente con la plataforma en la nube cuando se recupera la conexión. Esto es especialmente útil para formaciones en campo, zonas rurales o lugares con conectividad limitada.",
  },
  {
    cat: "siercp",
    q: "¿Qué métricas mide el sistema durante una sesión de RCP?",
    a: "SIERCP monitorea en tiempo real: profundidad de compresión (objetivo 5–6 cm según AHA 2020), frecuencia de compresiones (100–120 por minuto), fracción de compresiones torácicas (no manos-libre > 60%), posición de las manos, retroceso completo del tórax, ratio de ventilación, y tiempo hasta la primera compresión. Al finalizar, genera un informe PDF con todas las métricas comparadas contra los estándares AHA.",
  },
  {
    cat: "siercp",
    q: "¿Los certificados generados por SIERCP tienen validez legal?",
    a: "Los certificados digitales de SIERCP incluyen un código QR de verificación y son emitidos con respaldo de hash blockchain, lo que garantiza su autenticidad e inmutabilidad. En cuanto a validez, los certificados demuestran el cumplimiento de los protocolos de calidad AHA 2020/2025. La validez legal específica puede variar según el sector (salud, rescate, educación) y el ente regulador de tu institución; nuestro equipo puede asesorarte sobre los requisitos aplicables a tu caso.",
  },
  {
    cat: "cursos",
    q: "¿Qué programas ofrece Jomar Segurid?",
    a: "Ofrecemos 9 programas activos: BLS (Soporte Vital Básico) AHA, ACLS (Soporte Vital Cardiovascular Avanzado) AHA, PALS (Soporte Vital Pediátrico Avanzado) AHA, Primeros Auxilios Básicos, Salvamento Acuático, Primeros Auxilios para Empresas (SGSST), Manejo del DEA, RCP Neonatal, y Formación de Instructores AHA. Cada programa tiene sus propios requisitos de entrada, duración y modalidad.",
  },
  {
    cat: "cursos",
    q: "¿Los instructores están certificados internacionalmente?",
    a: "Sí. Todos nuestros instructores son Training Faculty o Instructores activos de la American Heart Association (AHA), con carnet vigente y renovación cada 2 años. Adicionalmente, varios tienen certificaciones de la Cruz Roja Colombiana, el Consejo Colombiano de Reanimación y organismos de salvamento acuático como la ILSE (International Life Saving Europe Federation).",
  },
  {
    cat: "cursos",
    q: "¿Cuánto tiempo dura cada curso y cómo se imparten?",
    a: "La duración varía por programa: BLS Básico dura 4 horas, ACLS entre 12–16 horas, PALS 14–16 horas, y los programas empresariales se adaptan a las necesidades de la empresa (desde 2 horas de sensibilización hasta 8 horas de formación completa). Ofrecemos tres modalidades: presencial en nuestra sede, presencial en tu empresa (mínimo 10 personas), y próximamente modalidad híbrida teórica online + práctica presencial.",
  },
  {
    cat: "cursos",
    q: "¿Los cursos tienen algún prerrequisito?",
    a: "Depende del programa. BLS, Primeros Auxilios y DEA no requieren ningún conocimiento previo y están abiertos al público general. ACLS requiere certificación BLS vigente y conocimientos de electrocardiografía básica (generalmente para médicos, enfermeros y paramédicos). PALS requiere ACLS vigente. El curso de Formación de Instructores requiere ser proveedor activo del programa en el que deseas instruir.",
  },
  {
    cat: "planes",
    q: "¿Qué incluye la suscripción anual al software SIERCP?",
    a: "La suscripción incluye: acceso completo al dashboard de gestión, sesiones ilimitadas según el plan, actualizaciones automáticas del software, certificados digitales ilimitados, reportes PDF y acceso a la API de integración (planes Profesional y Enterprise). El plan Starter incluye soporte por email, Profesional agrega soporte prioritario con respuesta en 4 horas, y Enterprise incluye un gerente de cuenta dedicado.",
  },
  {
    cat: "planes",
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Puedes hacer un upgrade de plan en cualquier momento y el cobro se ajusta de forma proporcional al tiempo restante del período. Para hacer downgrade, el cambio aplica al inicio del siguiente período anual. Si por alguna razón necesitas cancelar, ofrecemos una garantía de 30 días con reembolso completo desde el momento de la suscripción.",
  },
  {
    cat: "planes",
    q: "¿El plan Enterprise tiene precio fijo?",
    a: "El Enterprise tiene un precio base de $750.000 COP/mes (facturado anualmente), pero es completamente personalizable. Dependiendo del número de sedes, volumen de sesiones, integraciones especiales o características custom que requieras, el precio puede variar. Escríbenos o agenda una llamada con nuestro equipo comercial para recibir una cotización a la medida de tu organización.",
  },
  {
    cat: "soporte",
    q: "¿Cómo contacto el soporte técnico si algo falla durante una sesión?",
    a: "Tenemos varios canales: para emergencias técnicas durante una sesión activa, usa el botón 'SOS Soporte' dentro de la app, que conecta directamente con un técnico por WhatsApp en menos de 30 minutos. Para incidencias no urgentes, puedes abrir un ticket desde el portal SIERCP en soporte@siercp.co. Los planes Profesional tienen respuesta garantizada en 4 horas y Enterprise en 1 hora en horario extendido.",
  },
  {
    cat: "soporte",
    q: "¿Qué pasa si un sensor se daña o deja de funcionar?",
    a: "Todos nuestros sensores tienen 12 meses de garantía de fábrica que cubre defectos de fabricación. Si el daño es por uso normal o defecto, lo reemplazamos sin costo. Si el daño es por mal uso, ofrecemos un servicio de reemplazo a precios preferenciales para nuestros suscriptores. También ofrecemos un plan de mantenimiento preventivo semestral incluido en los planes Profesional y Enterprise.",
  },
  {
    cat: "aha",
    q: "¿Por qué los estándares AHA son importantes?",
    a: "La American Heart Association publica las guías internacionales de RCP y emergencias cardiovasculares desde 1966, actualizándolas cada 5 años con la más reciente evidencia científica (la última actualización fue en 2020). Las instituciones, hospitales y empleadores en Colombia y el mundo reconocen la certificación AHA como el estándar de oro en competencia en reanimación. Un proveedor BLS-AHA certificado demuestra que domina las técnicas con la mejor evidencia científica disponible.",
  },
  {
    cat: "aha",
    q: "¿Con qué frecuencia debo renovar mi certificación AHA?",
    a: "Las certificaciones AHA tienen una vigencia de 2 años para BLS, ACLS y PALS. La AHA recomienda la renovación antes del vencimiento porque el rendimiento en RCP tiende a degradarse sin práctica regular. SIERCP facilita esto con recordatorios automáticos 90, 60 y 30 días antes del vencimiento del carnet de cada estudiante, además de permitir sesiones de práctica continua para mantener las habilidades.",
  },
];

export const helpTopics: HelpTopic[] = [
  {
    icon: "bi-play-circle",
    title: "Tutoriales en video",
    desc: "Guías paso a paso para configurar y usar SIERCP",
    href: "#",
  },
  {
    icon: "bi-file-text",
    title: "Documentación técnica",
    desc: "Manuales de instalación, API y especificaciones",
    href: "#",
  },
  {
    icon: "bi-people",
    title: "Comunidad de usuarios",
    desc: "Foro de instructores y administradores SIERCP",
    href: "#",
  },
  {
    icon: "bi-envelope-at",
    title: "Soporte por email",
    desc: "soporte@siercp.co — respuesta en < 24h",
    href: "mailto:soporte@siercp.co",
  },
];