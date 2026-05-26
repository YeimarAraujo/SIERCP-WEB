'use client';

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Navbar from "@/components/page/Navbar";
import Footer from "@/components/page/Footer";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../landing.css';

const SECTIONS = [
  {
    icon: "bi-file-earmark-text-fill",
    title: "1. Aceptación de los Términos",
    content: `Al acceder y utilizar la plataforma SIERCP (siercp.jomarsegurid.co) y sus servicios asociados, usted acepta quedar vinculado por los presentes Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, le solicitamos que se abstenga de usar la plataforma.

Estos términos constituyen un acuerdo legal entre usted y JOMAR SEGURID S.A.S. (en adelante "SIERCP" o "la Empresa"). SIERCP se reserva el derecho de modificar estos términos en cualquier momento, notificando los cambios con al menos 30 días de anticipación.`,
  },
  {
    icon: "bi-mortarboard-fill",
    title: "2. Descripción del Servicio",
    content: `SIERCP es una plataforma tecnológica de formación en emergencias médicas que ofrece:

• Cursos presenciales, virtuales e híbridos en Reanimación Cardiopulmonar (RCP) y primeros auxilios bajo estándares AHA 2025.
• Sistema de evaluación IoT en tiempo real mediante maniquíes instrumentados con sensores de compresión y ventilación.
• Emisión de certificados digitales verificables al completar exitosamente los programas de formación.
• Acceso a una plataforma LMS para el seguimiento académico, recursos de estudio y comunicación entre instructores y estudiantes.
• Planes de suscripción corporativa para instituciones, hospitales y centros de formación SST.`,
  },
  {
    icon: "bi-person-fill-check",
    title: "3. Registro y Cuentas de Usuario",
    content: `Para acceder a los servicios de SIERCP debe:

• Ser mayor de 18 años o contar con autorización expresa de un tutor legal.
• Proporcionar información veraz, completa y actualizada durante el registro.
• Mantener la confidencialidad de sus credenciales de acceso.
• Notificar de inmediato cualquier uso no autorizado de su cuenta.

SIERCP se reserva el derecho de suspender o cancelar cuentas que proporcionen información falsa, incurran en actividades fraudulentas o violen estos términos. Usted es responsable de todas las actividades realizadas desde su cuenta.`,
  },
  {
    icon: "bi-credit-card-2-front-fill",
    title: "4. Pagos y Facturación",
    content: `Los pagos en la plataforma SIERCP se procesan de manera segura a través de Wompi (certificado PCI-DSS Level 1). Al realizar un pago, usted acepta:

• Los precios indicados incluyen IVA cuando aplique según la normativa colombiana.
• Los pagos con tarjeta de crédito/débito son procesados en tiempo real; los pagos PSE pueden demorar hasta 2 horas hábiles en confirmarse.
• Los planes de suscripción corporativa se facturan mensual o anualmente según la modalidad elegida.
• Las compras de hardware (maniquíes IoT) tienen un plazo de entrega de 5 a 10 días hábiles dentro de Colombia.

Política de reembolsos: Los cursos pueden cancelarse con reembolso completo hasta 48 horas antes del inicio. Después de iniciado el curso, no se realizan reembolsos salvo cancelación por parte de SIERCP.`,
  },
  {
    icon: "bi-shield-fill-exclamation",
    title: "5. Conducta del Usuario",
    content: `Queda estrictamente prohibido:

• Compartir credenciales de acceso o certificados obtenidos de forma fraudulenta.
• Intentar acceder a áreas de la plataforma para las que no tiene autorización.
• Reproducir, distribuir o comercializar el contenido formativo sin autorización escrita previa.
• Usar la plataforma para actividades ilegales, difamatorias o que infrinjan derechos de terceros.
• Realizar ingeniería inversa, decompilación o modificación de los sistemas SIERCP.
• Interferir con el funcionamiento normal de la plataforma o los dispositivos IoT asociados.

El incumplimiento de estas normas puede resultar en la suspensión inmediata de la cuenta sin derecho a reembolso.`,
  },
  {
    icon: "bi-award-fill",
    title: "6. Certificaciones y Validez",
    content: `Los certificados emitidos por SIERCP:

• Son válidos según las directrices de la American Heart Association (AHA) vigentes al momento de la emisión.
• La vigencia de las certificaciones BLS y ACLS es de 2 años conforme a estándares AHA.
• SIERCP no garantiza el reconocimiento de los certificados por parte de empleadores o entidades específicas fuera del ámbito educativo.
• La obtención del certificado requiere aprobar todas las evaluaciones teóricas y prácticas con los mínimos establecidos para cada programa.
• SIERCP puede revocar un certificado si se comprueba que fue obtenido mediante fraude o suplantación.`,
  },
  {
    icon: "bi-cpu-fill",
    title: "7. Hardware IoT — Maniquíes SIERCP",
    content: `La adquisición de maniquíes SIERCP IoT está sujeta a:

• Garantía de hardware de 1 a 3 años según el paquete adquirido, que cubre defectos de fabricación.
• La garantía no cubre daños por mal uso, accidentes, líquidos o modificaciones no autorizadas.
• Las actualizaciones de firmware son gratuitas durante el período de garantía.
• El cliente es responsable del mantenimiento básico (limpieza con desinfectantes aprobados, almacenamiento adecuado).
• SIERCP ofrece soporte técnico remoto y presencial (según el plan) para resolver problemas de conectividad o funcionamiento.`,
  },
  {
    icon: "bi-c-circle-fill",
    title: "8. Propiedad Intelectual",
    content: `Todo el contenido de la plataforma SIERCP, incluyendo textos, imágenes, videos de formación, algoritmos de evaluación IoT, diseños de interfaz y materiales de curso, es propiedad exclusiva de JOMAR SEGURID S.A.S. y está protegido por las leyes colombianas e internacionales de propiedad intelectual.

Se concede al usuario una licencia limitada, no exclusiva e intransferible para acceder al contenido únicamente para fines de formación personal. Cualquier uso comercial o reproducción no autorizada será perseguida legalmente.`,
  },
  {
    icon: "bi-exclamation-triangle-fill",
    title: "9. Limitación de Responsabilidad",
    content: `SIERCP no será responsable por:

• Daños indirectos, incidentales o consecuentes derivados del uso de la plataforma.
• Interrupciones del servicio causadas por mantenimiento programado, fallos de terceros (Firebase, Wompi) o causas de fuerza mayor.
• Decisiones médicas o de emergencia tomadas basándose en la formación recibida; la formación en RCP no reemplaza la atención médica profesional.
• Pérdida de datos causada por el usuario (eliminación de cuenta, cambio de contraseña, etc.).

La responsabilidad máxima de SIERCP se limita al valor pagado por el servicio o producto en los últimos 12 meses.`,
  },
  {
    icon: "bi-geo-alt-fill",
    title: "10. Legislación Aplicable",
    content: `Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia que surja en relación con estos términos será sometida a la jurisdicción de los tribunales competentes de Valledupar, Cesar, Colombia.

Para resolución amigable de disputas, las partes acuerdan agotar una instancia de mediación ante la Cámara de Comercio de Valledupar antes de iniciar acciones judiciales.

Fecha de vigencia: mayo de 2026.`,
  },
];

export default function TerminosPage() {
  return (
    <div style={{ background: "var(--clr-bg)" }}>
      <Navbar forceScrolled />

      {/* Hero */}
      <section style={{ background: "var(--clr-bg-hero)", padding: "120px 0 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 70% 30%, rgba(109,74,255,0.2) 0%, transparent 50%)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center">
            <span className="badge-pill-white mb-4 d-inline-flex">
              <i className="bi bi-file-earmark-text-fill" style={{ fontSize: "0.8rem" }} /> Legal · Términos
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: "20px" }}>
              Términos y Condiciones<br />
              <span style={{ color: "#a5f3fc" }}>de Uso del Servicio</span>
            </h1>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.7 }}>
              Al usar la plataforma SIERCP acepta estos términos. Léalos cuidadosamente antes de registrarse o adquirir cualquier servicio.
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section style={{ padding: "80px 0 100px" }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={9} xl={8}>
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                {SECTIONS.map((s, i) => (
                  <div key={i} style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "32px 36px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--clr-primary-alpha)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`bi ${s.icon}`} style={{ color: "var(--clr-primary)", fontSize: "1.2rem" }} />
                      </div>
                      <h2 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--clr-text-head)", margin: 0 }}>{s.title}</h2>
                    </div>
                    <div style={{ fontSize: "0.92rem", color: "var(--clr-text)", lineHeight: 1.85, whiteSpace: "pre-line" }}>
                      {s.content}
                    </div>
                  </div>
                ))}

                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "28px 36px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>¿Dudas sobre los términos?</div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--clr-text)" }}>Contáctenos antes de aceptar si tiene alguna pregunta.</p>
                  </div>
                  <a href="/contacto" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--clr-primary)", color: "#fff", padding: "12px 24px", borderRadius: "12px", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem", flexShrink: 0 }}>
                    <i className="bi bi-chat-dots-fill" /> Contactar
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
