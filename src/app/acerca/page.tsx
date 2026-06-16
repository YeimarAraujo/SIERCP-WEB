'use client';

import React, { useRef, useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Navbar from "@/components/page/Navbar";
import Footer from "@/components/page/Footer";
import WhatsAppFab from "@/components/page/WhatsAppFab";
import Link from "next/link";

const FEATURES = [
  {
    icon: "bi-cpu-fill",
    color: "#1800ad",
    title: "Maniquí IoT Inteligente",
    desc: "Sensores de presión y acelerómetros miden en tiempo real la profundidad, frecuencia y retroceso de cada compresión. Conectividad BLE 5.2 con la app en menos de 2 segundos.",
  },
  {
    icon: "bi-graph-up-arrow",
    color: "#6d4aff",
    title: "Retroalimentación en Tiempo Real",
    desc: "El instructor ve en su dashboard el desempeño de cada estudiante durante la práctica. Alertas inmediatas si la compresión es insuficiente o el ritmo se desvía del estándar AHA.",
  },
  {
    icon: "bi-mortarboard-fill",
    color: "#10b981",
    title: "LMS Académico Completo",
    desc: "Gestión de cursos, módulos, guías y evaluaciones. Calendario de sesiones, videoconferencia integrada para sesiones en vivo y seguimiento de avance por estudiante.",
  },
  {
    icon: "bi-patch-check-fill",
    color: "#f59e0b",
    title: "Certificados Digitales Verificables",
    desc: "Cada certificado incluye un código único verificable en línea. Compatible con estándares AHA 2025 y requisitos del Ministerio de Salud de Colombia.",
  },
  {
    icon: "bi-shield-lock-fill",
    color: "#ef4444",
    title: "Seguridad Enterprise",
    desc: "Control de acceso por roles (RBAC), cifrado TLS 1.3, reglas Firestore auditadas y autenticación con Firebase Auth. Cumplimiento Ley 1581 de 2012.",
  },
  {
    icon: "bi-building-fill",
    color: "#0ea5e9",
    title: "Gestión Multi-institución",
    desc: "El Super Admin puede gestionar múltiples instituciones, administradores, instructores y estudiantes desde un solo panel centralizado.",
  },
  {
    icon: "bi-calendar-check-fill",
    color: "#8b5cf6",
    title: "Simulaciones y Calendario",
    desc: "Programa sesiones de práctica, asigna grupos a instructores y monitorea el histórico completo de cada maniquí y cada estudiante.",
  },
  {
    icon: "bi-phone-fill",
    color: "#ec4899",
    title: "App Móvil Nativa (iOS & Android)",
    desc: "Estudiantes e instructores llevan SIERCP en su bolsillo. QR para registro de asistencia, notificaciones push y acceso offline a materiales de estudio.",
  },
];

const ROLES = [
  {
    icon: "bi-person-badge-fill",
    color: "#1800ad",
    title: "Estudiante",
    perks: [
      "Dashboard personalizado con mis cursos activos",
      "Historial completo de sesiones de práctica IoT",
      "Mis certificados en un solo lugar",
      "Ranking de desempeño y gamificación",
      "Descarga de guías y materiales de estudio",
    ],
  },
  {
    icon: "bi-person-workspace",
    color: "#6d4aff",
    title: "Instructor",
    perks: [
      "Monitor en vivo de todos los maniquíes del aula",
      "Creación y edición de cursos y módulos",
      "Evaluaciones con corrección automática",
      "Reportes de desempeño por estudiante y grupo",
      "Sesiones en vivo con videoconferencia integrada",
    ],
  },
  {
    icon: "bi-shield-fill",
    color: "#10b981",
    title: "Administrador",
    perks: [
      "Gestión de instructores, estudiantes y dispositivos",
      "Inscripción masiva vía importación CSV",
      "Dashboard con métricas clave de la institución",
      "Configuración de cursos y grupos de la plataforma",
      "Gestión de certificados emitidos y pendientes",
    ],
  }
];

const METRICS = [
  { value: "98%", label: "Precisión en métricas de compresión vs. patrón AHA" },
  { value: "<2s", label: "Latencia de datos BLE maniquí → app en condiciones normales" },
  { value: "99.9%", label: "Uptime de la plataforma (Firebase SLA)" },
  { value: "256-bit", label: "Cifrado SSL en todas las transmisiones de datos" },
];

export default function AcercaPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ background: "var(--clr-bg)" }}>
      <Navbar forceScrolled />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--clr-bg-hero)", padding: "130px 0 90px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 18%, rgba(109,74,255,0.18) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(255,255,255,0.05) 0%, transparent 50%)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: "24px" }}>
                El sistema que<br />
                <span style={{ color: "#a5f3fc" }}>transforma la formación</span><br />
                en RCP
              </h1>
              <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.8, marginBottom: "36px", maxWidth: "520px" }}>
                SIERCP integra hardware IoT, inteligencia de datos y una plataforma LMS profesional para llevar la evaluación de Reanimación Cardiopulmonar al siguiente nivel bajo estándares <strong style={{ color: "#a5f3fc" }}>AHA 2025</strong>.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link href="/planes" className="btn-brand-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-rocket-takeoff-fill me-2" />Ver planes
                </Link>
                <Link href="/contacto" className="btn-outline-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-play-circle-fill me-2" />Solicitar demo
                </Link>
              </div>
            </Col>
            <Col lg={6}>
              <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 70px rgba(0,0,0,0.45)" }}>
                <img
                  src="/assets/images/SICAP/webp/software_sicap.webp"
                  alt="Plataforma de software SIERCP en uso"
                  className="img-fluid"
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
                {/* Velo de marca para integrar la imagen con el fondo oscuro del hero */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(135deg, rgba(24,0,173,0.18) 0%, transparent 45%)", boxShadow: "inset 0 0 120px rgba(0,0,0,0.35)" }} />
              </div>
            </Col>
          </Row>

          {/* Métricas (debajo del hero, conservadas como franja) */}
          {/* <Row className="g-3" style={{ marginTop: "44px" }}>
            {METRICS.map((m, i) => (
              <Col key={i} xs={6} lg={3}>
                <div style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px", padding: "24px 22px", height: "100%",
                  backdropFilter: "blur(12px)",
                }}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#a5f3fc", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "10px" }}>{m.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{m.label}</div>
                </div>
              </Col>
            ))}
          </Row> */}
        </Container>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="section-py" style={{ background: "var(--clr-bg)" }}>
        <Container>
          <div className={`text-center mb-5 fade-up ${visible ? "visible" : ""}`}>
            <span className="badge-pill mb-3">Tecnología de punta</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
              Todo lo que necesita para <span style={{ color: "var(--clr-primary)" }}>certificar con excelencia</span>
            </h2>
            <p className="mx-auto mt-3" style={{ maxWidth: "580px", fontSize: "1.05rem", color: "var(--clr-text)", lineHeight: 1.7 }}>
              Una sola plataforma que conecta el maniquí IoT, el instructor, el estudiante y la institución.
            </p>
          </div>
          <Row className="g-4">
            {FEATURES.map((f, i) => (
              <Col key={i} md={6} lg={3}>
                <div
                  className={`fade-up ${visible ? "visible" : ""}`}
                  style={{ transitionDelay: `${i * 0.05}s`, background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "32px 28px", height: "100%", transition: "transform 0.3s, box-shadow 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                    <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: "1.4rem" }} />
                  </div>
                  <h4 style={{ fontWeight: 900, color: "var(--clr-text-head)", fontSize: "1rem", marginBottom: "12px" }}>{f.title}</h4>
                  <p style={{ fontSize: "0.88rem", color: "var(--clr-muted)", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── ROLES ─────────────────────────────────────────────────────────── */}
      <section className="section-py" style={{ background: "var(--clr-bg-light)" }}>
        <Container>
          <div className="text-center mb-5">
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--clr-text-head)" }}>
              Una experiencia pensada para <span style={{ color: "var(--clr-primary)" }}>cada rol</span>
            </h2>
          </div>
          <Row className="g-4 justify-content-center">
            {ROLES.map((r, i) => (
              <Col key={i} md={6} lg={3}>
                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "24px", padding: "32px 28px", height: "100%" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: `${r.color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <i className={`bi ${r.icon}`} style={{ color: r.color, fontSize: "1.6rem" }} />
                  </div>
                  <h4 style={{ fontWeight: 900, fontSize: "1.1rem", color: r.color, marginBottom: "16px" }}>{r.title}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {r.perks.map((p, j) => (
                      <div key={j} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <i className="bi bi-check2-circle" style={{ color: r.color, fontSize: "0.9rem", flexShrink: 0, marginTop: "2px" }} />
                        <span style={{ fontSize: "0.85rem", color: "var(--clr-text)", lineHeight: 1.55 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── ARQUITECTURA TÉCNICA ──────────────────────────────────────────── */}
      <section className="section-py" style={{ background: "var(--clr-bg)" }}>
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5}>
              <span className="badge-pill mb-3">Stack tecnológico</span>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "24px" }}>
                Construido con tecnología de <span style={{ color: "var(--clr-primary)" }}>grado enterprise</span>
              </h2>
              <p style={{ fontSize: "1rem", color: "var(--clr-text)", lineHeight: 1.8, marginBottom: "28px" }}>
                Cada componente de SIERCP fue elegido por su fiabilidad, escalabilidad y seguridad. Sin compromisos.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { icon: "bi-fire", color: "#f59e0b", label: "Firebase (Auth · Firestore · Storage · Messaging)" },
                  { icon: "bi-code-slash", color: "#0ea5e9", label: "Next.js 16 + React 19 + TypeScript" },
                  { icon: "bi-phone-fill", color: "#6d4aff", label: "Flutter (iOS & Android · BLE 5.2)" },
                  { icon: "bi-credit-card-fill", color: "#10b981", label: "Wompi · PCI-DSS Level 1 · PSE · Nequi" },
                  { icon: "bi-cpu", color: "#ef4444", label: "ESP32 · Sensores de presión · BLE IoT" },
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "14px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${t.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`bi ${t.icon}`} style={{ color: t.color, fontSize: "1rem" }} />
                    </div>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--clr-text)" }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </Col>
            <Col lg={7}>
              {/* Visual de flujo de datos */}
              <div style={{ background: "var(--clr-bg-hero)", borderRadius: "28px", padding: "40px 36px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "28px", textAlign: "center" }}>
                  Flujo de datos en tiempo real
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { from: "Maniquí IoT (ESP32)", to: "App Flutter (BLE 5.2)", icon: "bi-bluetooth", color: "#a5f3fc" },
                    { from: "App Flutter", to: "Firebase Realtime DB", icon: "bi-wifi", color: "#6d4aff" },
                    { from: "Firebase", to: "Dashboard Instructor (Next.js)", icon: "bi-arrow-left-right", color: "#10b981" },
                    { from: "Wompi API", to: "Webhook SIERCP → Firestore", icon: "bi-shield-lock-fill", color: "#f59e0b" },
                    { from: "Firestore", to: "Certificado PDF verificable", icon: "bi-patch-check-fill", color: "#ec4899" },
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "rgba(255,255,255,0.04)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: step.color, width: "160px", flexShrink: 0 }}>{step.from}</div>
                      <i className={`bi ${step.icon}`} style={{ color: step.color, fontSize: "1rem", flexShrink: 0 }} />
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", flex: 1 }}>{step.to}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--clr-primary)", padding: "80px 0" }}>
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={7}>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", margin: 0 }}>
                ¿Listo para implementar SIERCP en su institución?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", margin: "14px 0 0", lineHeight: 1.65 }}>
                Agenda una demo gratuita de 45 minutos y vea el sistema funcionando con maniquíes reales en tiempo real.
              </p>
            </Col>
            <Col lg={5} className="text-lg-end">
              <div className="d-flex gap-3 flex-wrap justify-content-lg-end">
                <Link href="/contacto" className="btn-brand-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-play-circle-fill me-2" />Solicitar Demo
                </Link>
                <Link href="/planes" className="btn-outline-on-dark" style={{ padding: "14px 28px", borderRadius: "14px", fontSize: "0.95rem" }}>
                  <i className="bi bi-list-check me-2" />Ver Planes
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Footer />
      <WhatsAppFab />
    </div>
  );
}
