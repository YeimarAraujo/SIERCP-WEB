'use client';

import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";

const programs = [
  {
    icon: "bi-shield-shaded",
    title: "Primer Respondiente",
    desc: "Capacitación básica para actuar ante emergencias cotidianas y salvar vidas."
  },
  {
    icon: "bi-heart-pulse-fill",
    title: "Soporte Vital Básico",
    desc: "Dominio de RCP y uso del DEA bajo estándares internacionales de la AHA."
  },
  {
    icon: "bi-water",
    title: "Salvamento Acuático",
    desc: "Técnicas de rescate y seguridad en piscinas para personal certificado."
  }
];

export default function Formacion() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="formacion" ref={ref} className="section-py" style={{ background: "#1800ad", color: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Background decoration */}
      <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />

      <Container style={{ position: "relative", zIndex: 1 }}>
        <Row className="align-items-center g-5">
          <Col lg={5} className={`fade-up ${isVisible ? "visible" : ""}`}>
            <span className="badge-pill-white mb-3">Formación Académica</span>
            <h2 className="on-dark-title" style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 900, marginBottom: 20, lineHeight: 1.15 }}>
              Formamos los <span style={{ color: 'var(--clr-accent)' }}>socorristas</span> del futuro
            </h2>
            <p className="on-dark-text mb-5" style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
              Nuestros programas integran rigor técnico y práctica clínica simulada,
              preparando a instituciones bajo estándares internacionales de respuesta.
            </p>

            <div className="d-flex gap-5 mb-5">
              {[["15+", "Aliados"], ["04", "Niveles"], ["100%", "Avalado"]].map(([n, l]) => (
                <div key={l} style={{ borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: "15px" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--clr-accent)", lineHeight: 1 }}>{n}</div>
                  <div className="on-dark-muted" style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>

            <a href="/#contacto" className="btn-brand-on-dark py-3 px-5" style={{ borderRadius: "15px" }}>
              Solicitar Programa <i className="bi bi-chevron-right ms-2" />
            </a>
          </Col>

          <Col lg={7}>
            <div className={`fade-in-right ${isVisible ? "visible" : ""}`} style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "28px",
              padding: "32px"
            }}>
              <div className="d-flex flex-column gap-3">
                {programs.map((p, i) => (
                  <div key={i} className="card-glass p-3 d-flex align-items-center gap-4" style={{
                    transition: "all 0.3s ease",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "18px"
                  }}>
                    <div className="icon-box icon-box-md" style={{
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.1)",
                      color: "var(--clr-accent)"
                    }}>
                      <i className={`bi ${p.icon}`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h6 className="on-dark-title" style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>{p.title}</h6>
                      <p className="on-dark-muted" style={{ margin: 0, fontSize: "0.85rem" }}>{p.desc}</p>
                    </div>
                    <i className="bi bi-chevron-right on-dark-muted" style={{ fontSize: "0.8rem" }} />
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
