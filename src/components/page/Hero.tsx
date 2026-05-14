'use client';

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "../../app/landing.css";

const heroImg = "/assets/hero-bg.jpeg";

const stats = [
  { value: "20+", label: "Años de experiencia" },
  { value: "40", label: "Est. máx por grupo" },
  { value: "AHA 2025", label: "Certificado" },
  { value: "+500", label: "Profesionales formados" },
];

export default function Hero() {
  return (
    <section id="inicio" style={{
      minHeight: "100vh",
      background: "var(--clr-bg-hero)",
      display: "flex",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
      padding: "80px 0 40px"
    }}>
      {/* Orb 1 — large soft purple */}
      <div style={{
        position: "absolute",
        top: "10%",
        right: "10%",
        width: "70%",
        height: "70%",
        background: "radial-gradient(ellipse 55% 60% at 75% 20%, rgba(100,80,255,0.35) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      {/* Orb 2 — cyan accent bottom-left */}
      <div style={{
        position: "absolute",
        bottom: "5%",
        left: "0%",
        width: "50%",
        height: "50%",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      {/* Subtle circular accent top-right */}
      <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(109, 74, 255, 0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      <Container style={{ position: "relative", zIndex: 1 }}>
        <Row className="align-items-center g-5">
          <Col lg={7} className="text-center text-lg-start">
            {/* Badge */}
            <div className="badge-pill-white mb-4 hero-badge-enter">
              <span className="pulse-dot" />
              <i className="bi bi-shield-check text-accent" /> 20 Años Protegiendo el Caribe
            </div>

            {/* H1 */}
            <h1 className="hero-h1-enter" style={{
              fontSize: "clamp(2.5rem, 7vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: 24,
              color: "#fff"
            }}>
              Líderes en <span style={{ color: "#fff", borderBottom: "4px solid var(--clr-accent)" }}>Simulación</span> de Grado <span className="hero-underline">Clínico</span>
            </h1>

            {/* Subtitle */}
            <p className="mb-5 on-dark-text hero-subtitle-enter" style={{
              fontSize: "1.2rem",
              maxWidth: "600px",
              lineHeight: 1.7,
              opacity: 0.9,
              color: "#fff"
            }}>
              Desde 2024, transformamos la formación en emergencias mediante tecnología
              SIERCP de última generación y estándares AHA 2025.
            </p>

            {/* CTAs */}
            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start hero-cta-enter">
              <a href="/login" className="btn-brand-on-dark py-3 px-5" style={{ borderRadius: "15px", fontWeight: 800 }}>
                Acceder a SIERCP App <i className="bi bi-cpu ms-2" />
              </a>
              <a href="/programas" className="btn-outline-on-dark py-3 px-5" style={{ borderRadius: "15px" }}>
                Ver Programas
              </a>
            </div>

            {/* Stats Row */}
            <div className="d-flex align-items-center mt-5 hero-stats-enter hero-stats-row" style={{ gap: "0" }}>
              {stats.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && (
                    <div className="stat-divider" style={{
                      width: "1px",
                      height: "36px",
                      background: "rgba(255,255,255,0.15)",
                      margin: "0 20px",
                      flexShrink: 0,
                    }} />
                  )}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      fontSize: "1.3rem",
                      fontWeight: 900,
                      color: "#fff",
                      lineHeight: 1,
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      marginTop: 4,
                      letterSpacing: "0.5px",
                    }}>
                      {stat.label}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Col>

          <Col lg={5} className="d-none d-lg-block">
            <div style={{ position: "relative" }} className="hero-image-enter">
              {/* Decorative ring */}
              <div style={{
                position: "absolute",
                inset: "-26px",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "38px",
                pointerEvents: "none",
                zIndex: 0,
              }} />

              {/* Background rotated pane */}
              <div style={{
                position: "absolute", inset: "-20px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "40px", transform: "rotate(-3deg)", zIndex: 0,
                border: "1px solid rgba(255,255,255,0.1)"
              }} />

              <img
                src={heroImg}
                alt="Formación Profesional Jomar"
                style={{
                  width: "100%",
                  borderRadius: "32px",
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 50px 100px rgba(0,0,0,0.4)",
                  animation: "float-senior 6s ease-in-out infinite",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}
              />

              {/* Floating AHA 2025 badge */}
              <div className="float-badge-anim" style={{
                position: "absolute",
                top: "-14px",
                right: "20px",
                zIndex: 10,
                background: "var(--clr-bg-surface)",
                color: "var(--clr-primary)",
                padding: "8px 16px",
                borderRadius: "100px",
                fontSize: "0.75rem",
                fontWeight: 800,
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <i className="bi bi-patch-check-fill" style={{ color: "var(--clr-accent)" }} />
                AHA 2025 Certificado
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
