'use client';

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Navbar from "@/components/page/Navbar";
import Footer from "@/components/page/Footer";

const SECTIONS = [
  {
    icon: "bi-person-badge-fill",
    title: "1. Responsable del Tratamiento",
    content: `JOMAR SEGURID S.A.S., identificada con NIT 000.000.000-0, con domicilio en Valledupar, Cesar, Colombia, es la responsable del tratamiento de los datos personales recolectados a través de la plataforma SIERCP y sus canales asociados.

Correo de contacto: info@jomarsegurid.co | Tel: +57 315 377 8892`,
  },
  {
    icon: "bi-database-fill-check",
    title: "2. Datos que Recopilamos",
    content: `Recopilamos los siguientes tipos de información personal:

• Datos de identificación: nombres, apellidos, número de documento, fecha de nacimiento.
• Datos de contacto: correo electrónico, número de teléfono, dirección.
• Datos académicos: historial de cursos, evaluaciones, certificados obtenidos.
• Datos de dispositivos IoT: métricas de sesiones de práctica (profundidad de compresiones, frecuencia, ventilaciones) vinculadas a su cuenta.
• Datos de navegación: dirección IP, tipo de dispositivo, páginas visitadas, tiempos de sesión.
• Datos de pago: procesados directamente por Wompi (PCI-DSS Level 1); SIERCP no almacena datos de tarjetas.`,
  },
  {
    icon: "bi-bullseye",
    title: "3. Finalidades del Tratamiento",
    content: `Sus datos son utilizados para:

• Gestionar su inscripción, matrícula y acceso a cursos de formación.
• Emitir certificados de competencia y constancias de participación.
• Procesar pagos y gestionar facturación.
• Monitorear el desempeño en sesiones de práctica con el maniquí IoT y generar retroalimentación personalizada.
• Enviar comunicaciones sobre actualizaciones de programas, nuevas fechas y contenidos AHA.
• Cumplir obligaciones legales ante entidades regulatorias (MINSALUD, INVIMA, Ministerio del Trabajo).
• Mejorar continuamente la plataforma mediante análisis de uso agregado y anonimizado.`,
  },
  {
    icon: "bi-shield-lock-fill",
    title: "4. Base Legal del Tratamiento",
    content: `El tratamiento de sus datos se fundamenta en:

• Ejecución de un contrato: cuando adquiere un curso o plan de suscripción.
• Consentimiento explícito: para el envío de comunicaciones de marketing y el uso de datos biométricos de práctica.
• Obligación legal: para el reporte a entidades de salud y formación según normativa colombiana.
• Interés legítimo: para mejorar la seguridad de la plataforma y prevenir el fraude.`,
  },
  {
    icon: "bi-lock-fill",
    title: "5. Seguridad de los Datos",
    content: `Implementamos medidas técnicas y organizativas de nivel empresarial:

• Cifrado en tránsito con TLS 1.3 (HTTPS obligatorio en toda la plataforma).
• Datos en reposo cifrados en infraestructura Firebase (Google Cloud, certificado ISO 27001).
• Control de acceso basado en roles (RBAC): cada usuario accede únicamente a sus propios datos.
• Autenticación segura con Firebase Authentication y tokens JWT de corta duración.
• Reglas de seguridad Firestore auditadas periódicamente.
• Pagos procesados exclusivamente por Wompi bajo certificación PCI-DSS Level 1; los datos de tarjeta nunca tocan nuestros servidores.`,
  },
  {
    icon: "bi-person-check-fill",
    title: "6. Sus Derechos (Habeas Data)",
    content: `De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013, usted tiene derecho a:

• Conocer: acceder a los datos que tenemos sobre usted en cualquier momento.
• Actualizar y rectificar: corregir datos inexactos o desactualizados.
• Suprimir: solicitar la eliminación de sus datos cuando no exista obligación legal de conservarlos.
• Revocar el consentimiento: retirar el consentimiento otorgado para finalidades específicas.
• Presentar quejas: ante la Superintendencia de Industria y Comercio (SIC) de Colombia.

Para ejercer estos derechos, escriba a: info@jomarsegurid.co con el asunto "Derechos ARCO".`,
  },
  {
    icon: "bi-clock-history",
    title: "7. Conservación de Datos",
    content: `Los datos personales se conservan durante el tiempo necesario para cumplir las finalidades descritas:

• Datos académicos y certificados: 10 años desde la emisión (exigencia de entidades regulatorias de salud).
• Datos de facturación: 5 años según normativa tributaria colombiana.
• Datos de sesiones IoT de práctica: 2 años desde la última sesión activa.
• Datos de marketing: hasta que revoque su consentimiento.

Transcurrido el período de conservación, los datos son eliminados o anonimizados de forma irreversible.`,
  },
  {
    icon: "bi-globe",
    title: "8. Transferencias Internacionales",
    content: `Sus datos pueden ser procesados en servidores de Google Cloud Platform (EE.UU.) a través de Firebase, que cuenta con Cláusulas Contractuales Estándar (SCC) aprobadas por la Comisión Europea y certificaciones SOC 2 / ISO 27001. Wompi procesa datos de pago bajo estándares PCI-DSS internacionales.

No vendemos, arrendamos ni cedemos sus datos personales a terceros con fines comerciales propios.`,
  },
  {
    icon: "bi-arrow-repeat",
    title: "9. Actualizaciones de esta Política",
    content: `Esta política puede actualizarse para reflejar cambios en nuestra práctica de datos o en la normativa aplicable. Cuando realicemos cambios sustanciales, le notificaremos por correo electrónico y mediante un aviso destacado en la plataforma con al menos 30 días de anticipación.

Fecha de última actualización: mayo 2026.`,
  },
];

export default function PrivacidadPage() {
  return (
    <div style={{ background: "var(--clr-bg)" }}>
      <Navbar forceScrolled />

      {/* Hero */}
      <section style={{ background: "var(--clr-bg-hero)", padding: "120px 0 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 70%, rgba(109,74,255,0.2) 0%, transparent 50%)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center">
            <span className="badge-pill-white mb-4 d-inline-flex">
              <i className="bi bi-shield-lock-fill" style={{ fontSize: "0.8rem" }} /> Legal · Privacidad
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: "20px" }}>
              Política de Privacidad y<br />
              <span style={{ color: "#a5f3fc" }}>Tratamiento de Datos</span>
            </h1>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", maxWidth: "580px", margin: "0 auto", lineHeight: 1.7 }}>
              Cumplimos con la Ley 1581 de 2012 (Habeas Data) y las mejores prácticas internacionales de protección de datos personales.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "28px", flexWrap: "wrap" }}>
              {[
                { icon: "bi-patch-check-fill", text: "Ley 1581 de 2012" },
                { icon: "bi-shield-fill-check", text: "GDPR Compatible" },
                { icon: "bi-lock-fill", text: "Cifrado SSL 256-bit" },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                  <i className={`bi ${b.icon}`} style={{ color: "#a5f3fc" }} /> {b.text}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section style={{ padding: "80px 0 100px" }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={9} xl={8}>
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {SECTIONS.map((s, i) => (
                  <div key={i} style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "32px 36px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--clr-primary-alpha)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`bi ${s.icon}`} style={{ color: "var(--clr-primary)", fontSize: "1.2rem" }} />
                      </div>
                      <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--clr-text-head)", margin: 0 }}>{s.title}</h2>
                    </div>
                    <div style={{ fontSize: "0.93rem", color: "var(--clr-text)", lineHeight: 1.85, whiteSpace: "pre-line" }}>
                      {s.content}
                    </div>
                  </div>
                ))}

                {/* Contact block */}
                <div style={{ background: "var(--clr-primary)", borderRadius: "20px", padding: "32px 36px", textAlign: "center" }}>
                  <i className="bi bi-envelope-fill" style={{ fontSize: "2rem", color: "rgba(255,255,255,0.8)", marginBottom: "16px", display: "block" }} />
                  <h3 style={{ color: "#fff", fontWeight: 900, fontSize: "1.3rem", marginBottom: "10px" }}>¿Preguntas sobre sus datos?</h3>
                  <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "20px", fontSize: "0.95rem" }}>
                    Nuestro equipo de privacidad responde en máximo 15 días hábiles.
                  </p>
                  <a
                    href="mailto:info@jomarsegurid.co?subject=Derechos ARCO - Solicitud de Privacidad"
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", color: "var(--clr-primary)", padding: "12px 28px", borderRadius: "12px", fontWeight: 800, textDecoration: "none", fontSize: "0.95rem" }}
                  >
                    <i className="bi bi-envelope" /> info@jomarsegurid.co
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
