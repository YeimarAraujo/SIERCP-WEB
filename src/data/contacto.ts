export interface ContactItem {
  icon: string;
  title: string;
  value: string;
  desc: string;
  href?: string;
}

export interface Office {
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  flag: string;
  isMain?: boolean;
}

export interface ResponseTime {
  canal: string;
  tiempo: string;
  color: string;
}

export interface ContactFaq {
  q: string;
  a: string;
}

export interface TrustReason {
  icon: string;
  text: string;
}

const WA = typeof window !== 'undefined'
  ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573153778892'}`
  : `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573153778892'}`;

export const contactItems: ContactItem[] = [
  {
    icon: "bi-geo-alt-fill",
    title: "Sede Principal",
    value: "Valledupar, Cesar",
    desc: "Cra. 9 #12-34, Centro Empresarial Arrecife",
  },
  {
    icon: "bi-whatsapp",
    title: "WhatsApp Soporte",
    value: "+57 315 377 8892",
    href: WA,
    desc: "Respuesta en menos de 2 horas",
  },
  {
    icon: "bi-envelope-fill",
    title: "Correo Electrónico",
    value: "info@jomarsegurid.co",
    href: "mailto:info@jomarsegurid.co",
    desc: "Consultas técnicas y comerciales",
  },
  {
    icon: "bi-telephone-fill",
    title: "Línea Fija",
    value: "(605) 123 4567",
    href: "tel:6051234567",
    desc: "Atención telefónica directa",
  },
  {
    icon: "bi-clock-fill",
    title: "Horario de Atención",
    value: "Lun–Vie: 7AM–6PM",
    desc: "Sábados: 8AM–2PM · Domingos: Cerrado",
  },
  {
    icon: "bi-headset",
    title: "Soporte Técnico SIERCP",
    value: "soporte@siercp.co",
    href: "mailto:soporte@siercp.co",
    desc: "Tickets de soporte 24/7",
  },
];

export const offices: Office[] = [
  {
    city: "Valledupar",
    address: "Cra. 9 #12-34, Centro Empresarial",
    phone: "(605) 123 4567",
    email: "info@jomarsegurid.co",
    hours: "Lun–Vie 7AM–6PM · Sáb 8AM–2PM",
    flag: "🇨🇴",
    isMain: true,
  },
];

export const responseTimes: ResponseTime[] = [
  { canal: "WhatsApp", tiempo: "< 2 horas", color: "#1800ad" },
  { canal: "Email corporativo", tiempo: "< 24 horas", color: "#1800ad" },
  { canal: "Soporte técnico SIERCP", tiempo: "< 4 horas", color: "#1800ad" },
  { canal: "Emergencias técnicas", tiempo: "< 30 min", color: "#1800ad" },
];

export const faqs: ContactFaq[] = [
  {
    q: "¿Cuánto tiempo tarda en responder el equipo?",
    a: "El canal de WhatsApp responde en menos de 2 horas en horario laboral. Los correos se atienden en máximo 24 horas. El soporte técnico de SIERCP tiene respuesta garantizada en 4 horas para planes Profesional y Enterprise.",
  },
  {
    q: "¿Ofrecen asesorías presenciales?",
    a: "Sí. Puedes agendar una visita a nuestra sede en Valledupar o solicitar que uno de nuestros asesores visite tu institución. Para empresas fuera de Valledupar, también ofrecemos asesorías virtuales por videollamada sin costo adicional.",
  },
  {
    q: "¿Tienen representantes en otras ciudades?",
    a: "Actualmente contamos con aliados en Barranquilla, Bogotá, Medellín y Bucaramanga. Si estás en otra ciudad, escríbenos y te conectamos con el representante más cercano o gestionamos la atención de forma remota.",
  },
  {
    q: "¿Puedo solicitar una demo del software SIERCP antes de contratar?",
    a: "Absolutamente. Ofrecemos demostraciones en vivo de 45 minutos donde mostramos el sistema en funcionamiento real con maniquíes. Solo diligencia el formulario de contacto seleccionando 'Demo SIERCP' y nuestro equipo coordina la sesión contigo.",
  },
];

export const reasons: TrustReason[] = [
  { icon: "bi-shield-check", text: "Respuesta garantizada en 24h" },
  { icon: "bi-award", text: "+20 años de experiencia" },
  { icon: "bi-people", text: "Equipo certificado AHA" },
  { icon: "bi-graph-up-arrow", text: "Soporte post-venta incluido" },
];

export const contactSubjects = [
  { value: "demo", label: "Demo del Software SIERCP" },
  { value: "cursos", label: "Información sobre Cursos y Programas" },
  { value: "empresa", label: "Convenio Empresarial" },
  { value: "soporte", label: "Soporte Técnico" },
  { value: "cotizacion", label: "Cotización de Plan" },
  { value: "otro", label: "Otro" },
];