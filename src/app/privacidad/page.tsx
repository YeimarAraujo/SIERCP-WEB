'use client';

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Navbar from "@/components/page/Navbar";
import Footer from "@/components/page/Footer";
import { LEGAL_ENTITY, pending } from "@/lib/legal-entity";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";

const POLICY_DATE = new Date(`${PRIVACY_POLICY_VERSION}T12:00:00Z`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

const E = LEGAL_ENTITY;

const SECTIONS = [
  {
    icon: "bi-person-badge-fill",
    title: "1. Responsable del tratamiento",
    content: `${E.name}, identificada con NIT ${pending(E.nit)}, con domicilio en ${E.city} y dirección ${pending(E.address)}, es la responsable del tratamiento de los datos personales recolectados en ${E.product} (aplicación móvil, sitio web, maniquí y simulador).

Correo: ${E.email} · Teléfono: ${E.phone}
Área que atiende consultas y reclamos: ${E.privacyOffice}.`,
  },
  {
    icon: "bi-database-fill-check",
    title: "2. Datos que tratamos",
    content: `• Identificación: nombres, apellidos, tipo y número de documento, fecha de nacimiento.
• Contacto: correo electrónico, teléfono, departamento y ciudad.
• Formación: cursos, evaluaciones, asistencia, certificados e insignias.
• Práctica de RCP: profundidad, ritmo, retroceso y pausas de las compresiones medidas por el maniquí, vinculadas a su cuenta. Son datos de desempeño en la práctica; no son datos de salud ni biométricos.
• Navegación y seguridad: dirección IP, dispositivo y registros de acceso.
• Pagos: los procesa Wompi. ${E.product} no almacena datos de tarjetas.

No solicitamos datos sensibles. Si alguna vez se pidiera uno, su respuesta sería facultativa (Ley 1581, art. 6).`,
  },
  {
    icon: "bi-bullseye",
    title: "3. Finalidades",
    content: `• Crear y administrar su cuenta, inscripciones y acceso a cursos.
• Medir su práctica, darle retroalimentación y permitir el seguimiento de su instructor y de la institución a la que pertenece.
• Emitir, verificar y revocar certificados e insignias.
• Procesar pagos y facturación.
• Atender consultas, reclamos y obligaciones legales.
• Elaborar estadísticas anonimizadas para mejorar la plataforma.
• Solo si lo autoriza aparte: enviarle novedades y ofertas de cursos.`,
  },
  {
    icon: "bi-shield-lock-fill",
    title: "4. Autorización",
    content: `Tratamos sus datos con su autorización previa, expresa e informada (Ley 1581, art. 9). La pedimos al crear la cuenta y antes de usar la plataforma, y guardamos constancia de la fecha, la versión de esta política y el canal (Decreto 1377, art. 7). La autorización para publicidad es opcional y separada.

No se requiere autorización en los casos del art. 10 de la Ley 1581, como información solicitada por una entidad pública en ejercicio de sus funciones o datos de naturaleza pública.

Si su institución o un instructor crea su cuenta, al ingresar por primera vez le pediremos su propia autorización.`,
  },
  {
    icon: "bi-people-fill",
    title: "5. Niñas, niños y adolescentes",
    content: `Solo tratamos datos de menores de 18 años cuando responde a su interés superior y con la autorización de su representante legal (Ley 1581, art. 7, y Decreto 1377, art. 12). Al registrarse, si la fecha de nacimiento indica que es menor, pedimos los datos y la autorización de su madre, padre o tutor.`,
  },
  {
    icon: "bi-person-check-fill",
    title: "6. Sus derechos",
    content: `Según el art. 8 de la Ley 1581 de 2012, usted puede:

• Conocer, actualizar y rectificar sus datos.
• Pedir prueba de la autorización otorgada.
• Ser informado sobre el uso que se da a sus datos.
• Revocar la autorización y pedir la supresión de sus datos, cuando no exista un deber legal o contractual de conservarlos.
• Acceder gratis a sus datos.
• Presentar quejas ante la Superintendencia de Industria y Comercio, después de agotar la consulta o el reclamo ante nosotros (Ley 1581, art. 16).`,
  },
  {
    icon: "bi-envelope-paper-fill",
    title: "7. Cómo ejercer sus derechos",
    content: `• En la plataforma: menú de usuario → "Mi privacidad" (web) o "Privacidad y datos" (app). Allí puede descargar sus datos, cambiar la autorización de publicidad y enviar solicitudes.
• Por correo: ${E.email}, indicando nombre, documento, la solicitud y un medio de respuesta.

Plazos (Ley 1581, arts. 14 y 15):
• Consultas: respuesta en máximo 10 días hábiles, prorrogables 5 días hábiles avisándole el motivo.
• Reclamos (corrección, actualización, supresión o revocación): máximo 15 días hábiles, prorrogables 8 días hábiles avisándole el motivo.`,
  },
  {
    icon: "bi-diagram-3-fill",
    title: "8. Quién más trata los datos",
    content: `• Su institución y sus instructores ven los datos de formación y práctica de sus estudiantes y cursos. No ven los de otras instituciones.
• Encargados que prestan servicios tecnológicos: Google (Firebase), Vercel (alojamiento web) y Wompi (pagos). Pueden procesar datos en servidores fuera de Colombia, incluidos Estados Unidos, bajo contrato de transmisión y con medidas de seguridad (Decreto 1377, arts. 24 y 25).

No vendemos ni cedemos sus datos a terceros para sus propios fines.`,
  },
  {
    icon: "bi-lock-fill",
    title: "9. Seguridad",
    content: `• Cifrado en tránsito (HTTPS) y en reposo en la infraestructura de Google Cloud.
• Acceso restringido: cada institución solo accede a los datos de sus miembros, y las búsquedas de personas quedan registradas.
• Las autorizaciones y solicitudes quedan en registros que no se pueden editar.`,
  },
  {
    icon: "bi-clock-history",
    title: "10. Conservación",
    content: `Conservamos los datos mientras tenga una cuenta activa y durante el tiempo necesario para verificar los certificados emitidos y cumplir deberes legales, contables y tributarios. Después los eliminamos o anonimizamos. Los datos de publicidad se conservan hasta que revoque esa autorización.`,
  },
  {
    icon: "bi-arrow-repeat",
    title: "11. Vigencia y cambios",
    content: `Esta política rige desde el ${POLICY_DATE}. Si cambia de forma sustancial, se lo avisaremos y le pediremos de nuevo su autorización al ingresar. Las bases de datos estarán vigentes mientras se cumplan las finalidades descritas.`,
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
              Tratamos sus datos según la Ley 1581 de 2012 y el Decreto 1377 de 2013.
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
                    href="mailto:info@jomarsegurid.co?subject=Solicitud de protección de datos"
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
