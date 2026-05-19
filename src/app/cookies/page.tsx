'use client';

import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Navbar from "@/components/page/Navbar";
import Footer from "@/components/page/Footer";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../landing.css';

const COOKIE_TYPES = [
  {
    icon: "bi-gear-fill",
    name: "Cookies Esenciales",
    badge: "Siempre activas",
    badgeColor: "#16a34a",
    description: "Necesarias para el funcionamiento básico de la plataforma. Sin ellas, funciones como el inicio de sesión, el carrito de compras y la navegación segura no funcionarían.",
    examples: [
      { name: "auth-token", purpose: "Mantiene la sesión iniciada de forma segura", duration: "7 días" },
      { name: "csrf-token", purpose: "Protección contra ataques CSRF", duration: "Sesión" },
      { name: "theme-preference", purpose: "Recuerda tu preferencia de tema (claro/oscuro)", duration: "1 año" },
    ],
    canDisable: false,
  },
  {
    icon: "bi-bar-chart-fill",
    name: "Cookies Analíticas",
    badge: "Recomendadas",
    badgeColor: "#1800ad",
    description: "Nos ayudan a entender cómo los usuarios interactúan con la plataforma, qué cursos tienen mayor demanda y dónde se producen fricciones en el proceso de compra.",
    examples: [
      { name: "_ga, _gid", purpose: "Google Analytics — estadísticas de uso anonimizadas", duration: "2 años / 24h" },
      { name: "siercp-session-id", purpose: "Análisis de flujo de navegación por sesión", duration: "30 minutos" },
    ],
    canDisable: true,
  },
  {
    icon: "bi-megaphone-fill",
    name: "Cookies de Marketing",
    badge: "Opcionales",
    badgeColor: "#d97706",
    description: "Permiten mostrarle contenido y anuncios relevantes sobre nuestros programas de formación en otras plataformas web.",
    examples: [
      { name: "_fbp", purpose: "Facebook Pixel — remarketing de cursos", duration: "3 meses" },
      { name: "li_sugr", purpose: "LinkedIn Insight — análisis de audiencias B2B", duration: "3 meses" },
    ],
    canDisable: true,
  },
];

export default function CookiesPage() {
  const [preferences, setPreferences] = useState({ analytic: true, marketing: false });

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("siercp-cookie-prefs", JSON.stringify({ ...preferences, essential: true, saved: true }));
      alert("Preferencias guardadas correctamente.");
    }
  };

  return (
    <div style={{ background: "var(--clr-bg)" }}>
      <Navbar forceScrolled />

      {/* Hero */}
      <section style={{ background: "var(--clr-bg-hero)", padding: "120px 0 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 50% 80%, rgba(109,74,255,0.2) 0%, transparent 60%)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center">
            <span className="badge-pill-white mb-4 d-inline-flex">
              <i className="bi bi-shield-check" style={{ fontSize: "0.8rem" }} /> Legal · Cookies
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: "20px" }}>
              Política de Cookies
            </h1>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.7 }}>
              Usamos cookies para ofrecerle la mejor experiencia posible. Aquí puede conocer exactamente qué usamos y por qué.
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section style={{ padding: "80px 0 100px" }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={9} xl={8}>

              {/* Intro */}
              <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "32px 36px", marginBottom: "28px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "14px" }}>¿Qué son las cookies?</h2>
                <p style={{ fontSize: "0.93rem", color: "var(--clr-text)", lineHeight: 1.85, margin: 0 }}>
                  Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo cuando los visita. Sirven para recordar sus preferencias, mantener su sesión iniciada, analizar el tráfico web y personalizar contenido. SIERCP utiliza cookies propias y de terceros siempre con transparencia y respeto por su privacidad.
                </p>
              </div>

              {/* Cookie types */}
              {COOKIE_TYPES.map((type, i) => (
                <div key={i} style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "20px", padding: "32px 36px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--clr-primary-alpha)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`bi ${type.icon}`} style={{ color: "var(--clr-primary)", fontSize: "1.2rem" }} />
                      </div>
                      <h2 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--clr-text-head)", margin: 0 }}>{type.name}</h2>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ padding: "4px 14px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800, background: `${type.badgeColor}15`, color: type.badgeColor }}>
                        {type.badge}
                      </span>
                      {type.canDisable && (
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                          <div
                            onClick={() => setPreferences(p => ({ ...p, [type.name === "Cookies Analíticas" ? "analytic" : "marketing"]: !p[type.name === "Cookies Analíticas" ? "analytic" : "marketing"] }))}
                            style={{
                              width: "44px", height: "24px", borderRadius: "100px", position: "relative", cursor: "pointer", transition: "background 0.3s",
                              background: preferences[type.name === "Cookies Analíticas" ? "analytic" : "marketing"] ? "#1800ad" : "#e2e8f0",
                            }}
                          >
                            <div style={{
                              position: "absolute", top: "3px", transition: "left 0.3s",
                              left: preferences[type.name === "Cookies Analíticas" ? "analytic" : "marketing"] ? "22px" : "3px",
                              width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            }} />
                          </div>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--clr-text)" }}>
                            {preferences[type.name === "Cookies Analíticas" ? "analytic" : "marketing"] ? "Activas" : "Desactivadas"}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: "0.92rem", color: "var(--clr-text)", lineHeight: 1.75, marginBottom: "20px" }}>{type.description}</p>

                  <div style={{ background: "var(--clr-bg)", border: "1px solid var(--clr-border)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", padding: "10px 16px", background: "var(--clr-primary)", fontSize: "0.72rem", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <span>Nombre</span>
                      <span>Finalidad</span>
                      <span>Duración</span>
                    </div>
                    {type.examples.map((ex, j) => (
                      <div key={j} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", padding: "12px 16px", borderTop: "1px solid var(--clr-border)", fontSize: "0.83rem", background: j % 2 === 0 ? "transparent" : "var(--clr-bg-light)" }}>
                        <code style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--clr-primary)", fontWeight: 700 }}>{ex.name}</code>
                        <span style={{ color: "var(--clr-text)", paddingRight: "12px" }}>{ex.purpose}</span>
                        <span style={{ color: "var(--clr-muted)", fontWeight: 600 }}>{ex.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Save preferences */}
              <div style={{ background: "var(--clr-bg-surface)", border: "2px solid var(--clr-primary)", borderRadius: "20px", padding: "32px 36px", textAlign: "center" }}>
                <h3 style={{ fontWeight: 900, color: "var(--clr-text-head)", marginBottom: "10px", fontSize: "1.2rem" }}>Guardar mis preferencias</h3>
                <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
                  Las cookies esenciales siempre están activas. Puede modificar las demás en cualquier momento.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={handleSave}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--clr-primary)", color: "#fff", padding: "12px 28px", borderRadius: "12px", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.95rem" }}
                  >
                    <i className="bi bi-check-circle-fill" /> Guardar preferencias
                  </button>
                  <button
                    onClick={() => { setPreferences({ analytic: false, marketing: false }); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "transparent", color: "var(--clr-muted)", padding: "12px 24px", borderRadius: "12px", fontWeight: 700, border: "1px solid var(--clr-border)", cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    Rechazar opcionales
                  </button>
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
